-- Run as one transaction before deploying code that reads these tables.
-- The lock prevents writes from being missed between the backfill and trigger installation.
BEGIN;

LOCK TABLE daily_aura_changes IN SHARE ROW EXCLUSIVE MODE;

CREATE INDEX IF NOT EXISTS daily_aura_student_latest_idx
    ON daily_aura_changes (student_id, lesson_date, category, id DESC);

CREATE TABLE IF NOT EXISTS student_aura_scores (
    student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lesson_date date NOT NULL,
    category text NOT NULL,
    change_id integer NOT NULL,
    aura integer NOT NULL,
    PRIMARY KEY (student_id, lesson_date, category)
);

CREATE TABLE IF NOT EXISTS student_aura_totals (
    student_id integer PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    total_aura bigint NOT NULL,
    active_days integer NOT NULL
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM student_aura_scores) OR EXISTS (SELECT 1 FROM student_aura_totals) THEN
        RAISE EXCEPTION 'Aura projection tables are not empty; refusing to overwrite them';
    END IF;
END;
$$;

INSERT INTO student_aura_scores (student_id, lesson_date, category, change_id, aura)
SELECT DISTINCT ON (student_id, lesson_date, category)
    student_id, lesson_date, category, id, new_aura
FROM daily_aura_changes
ORDER BY student_id, lesson_date, category, id DESC;

INSERT INTO student_aura_totals (student_id, total_aura, active_days)
SELECT student_id, SUM(aura), COUNT(DISTINCT lesson_date)::integer
FROM student_aura_scores
GROUP BY student_id;

CREATE FUNCTION refresh_student_aura_score(
    p_student_id integer, p_lesson_date date, p_category text
) RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    old_aura integer;
    old_change_id integer;
    latest_aura integer;
    latest_change_id integer;
    day_existed boolean;
    day_exists boolean;
BEGIN
    -- Cascading student deletion also deletes its projection rows.
    IF NOT EXISTS (SELECT 1 FROM students WHERE id = p_student_id) THEN
        RETURN;
    END IF;

    SELECT change_id, aura INTO old_change_id, old_aura
    FROM student_aura_scores
    WHERE student_id = p_student_id AND lesson_date = p_lesson_date AND category = p_category;

    SELECT id, new_aura INTO latest_change_id, latest_aura
    FROM daily_aura_changes
    WHERE student_id = p_student_id AND lesson_date = p_lesson_date AND category = p_category
    ORDER BY id DESC
    LIMIT 1;

    IF old_change_id IS NOT DISTINCT FROM latest_change_id
        AND old_aura IS NOT DISTINCT FROM latest_aura THEN
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM student_aura_scores
        WHERE student_id = p_student_id AND lesson_date = p_lesson_date
    ) INTO day_existed;

    IF latest_change_id IS NULL THEN
        DELETE FROM student_aura_scores
        WHERE student_id = p_student_id AND lesson_date = p_lesson_date AND category = p_category;
    ELSE
        INSERT INTO student_aura_scores (student_id, lesson_date, category, change_id, aura)
        VALUES (p_student_id, p_lesson_date, p_category, latest_change_id, latest_aura)
        ON CONFLICT (student_id, lesson_date, category)
        DO UPDATE SET change_id = EXCLUDED.change_id, aura = EXCLUDED.aura;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM student_aura_scores
        WHERE student_id = p_student_id AND lesson_date = p_lesson_date
    ) INTO day_exists;

    INSERT INTO student_aura_totals (student_id, total_aura, active_days)
    VALUES (
        p_student_id,
        COALESCE(latest_aura, 0)::bigint - COALESCE(old_aura, 0)::bigint,
        day_exists::integer - day_existed::integer
    )
    ON CONFLICT (student_id) DO UPDATE SET
        total_aura = student_aura_totals.total_aura + EXCLUDED.total_aura,
        active_days = student_aura_totals.active_days + EXCLUDED.active_days;
END;
$$;

CREATE FUNCTION sync_student_aura_projection() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    student_key integer;
    score_key record;
BEGIN
    IF current_setting('transaction_isolation') <> 'read committed' THEN
        RAISE EXCEPTION 'Aura projection requires READ COMMITTED isolation';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        FOR student_key IN
            SELECT student_id FROM (
                SELECT previous.student_id
                FROM old_rows previous FULL JOIN new_rows current ON current.id = previous.id
                WHERE previous.id IS NOT NULL AND (
                    current.id IS NULL OR (previous.student_id, previous.lesson_date, previous.category, previous.new_aura)
                        IS DISTINCT FROM (current.student_id, current.lesson_date, current.category, current.new_aura)
                )
                UNION
                SELECT current.student_id
                FROM old_rows previous FULL JOIN new_rows current ON current.id = previous.id
                WHERE current.id IS NOT NULL AND (
                    previous.id IS NULL OR (previous.student_id, previous.lesson_date, previous.category, previous.new_aura)
                        IS DISTINCT FROM (current.student_id, current.lesson_date, current.category, current.new_aura)
                )
            ) changed ORDER BY student_id
        LOOP
            PERFORM pg_advisory_xact_lock(-student_key::bigint);
        END LOOP;

        FOR score_key IN
            SELECT student_id, lesson_date, category FROM (
                SELECT previous.student_id, previous.lesson_date, previous.category
                FROM old_rows previous FULL JOIN new_rows current ON current.id = previous.id
                WHERE previous.id IS NOT NULL AND (
                    current.id IS NULL OR (previous.student_id, previous.lesson_date, previous.category, previous.new_aura)
                        IS DISTINCT FROM (current.student_id, current.lesson_date, current.category, current.new_aura)
                )
                UNION
                SELECT current.student_id, current.lesson_date, current.category
                FROM old_rows previous FULL JOIN new_rows current ON current.id = previous.id
                WHERE current.id IS NOT NULL AND (
                    previous.id IS NULL OR (previous.student_id, previous.lesson_date, previous.category, previous.new_aura)
                        IS DISTINCT FROM (current.student_id, current.lesson_date, current.category, current.new_aura)
                )
            ) changed ORDER BY student_id, lesson_date, category
        LOOP
            PERFORM refresh_student_aura_score(score_key.student_id, score_key.lesson_date, score_key.category);
        END LOOP;
    ELSE
        FOR student_key IN SELECT DISTINCT student_id FROM changed_rows ORDER BY student_id LOOP
            PERFORM pg_advisory_xact_lock(-student_key::bigint);
        END LOOP;
        FOR score_key IN
            SELECT DISTINCT student_id, lesson_date, category
            FROM changed_rows ORDER BY student_id, lesson_date, category
        LOOP
            PERFORM refresh_student_aura_score(score_key.student_id, score_key.lesson_date, score_key.category);
        END LOOP;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER student_aura_projection_insert
AFTER INSERT ON daily_aura_changes
REFERENCING NEW TABLE AS changed_rows
FOR EACH STATEMENT EXECUTE FUNCTION sync_student_aura_projection();

CREATE TRIGGER student_aura_projection_delete
AFTER DELETE ON daily_aura_changes
REFERENCING OLD TABLE AS changed_rows
FOR EACH STATEMENT EXECUTE FUNCTION sync_student_aura_projection();

CREATE TRIGGER student_aura_projection_update
AFTER UPDATE ON daily_aura_changes
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION sync_student_aura_projection();

CREATE FUNCTION clear_student_aura_projection() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    DELETE FROM student_aura_scores;
    DELETE FROM student_aura_totals;
    RETURN NULL;
END;
$$;

CREATE TRIGGER student_aura_projection_truncate
AFTER TRUNCATE ON daily_aura_changes
FOR EACH STATEMENT EXECUTE FUNCTION clear_student_aura_projection();

CREATE VIEW student_aura_totals_ready AS SELECT * FROM student_aura_totals;

COMMIT;
