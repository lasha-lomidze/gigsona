-- Read-only reconciliation. Both counts must be zero.
WITH expected_scores AS (
    SELECT DISTINCT ON (student_id, lesson_date, category)
        student_id, lesson_date, category, id AS change_id, new_aura AS aura
    FROM daily_aura_changes
    ORDER BY student_id, lesson_date, category, id DESC
),
score_mismatches AS (
    SELECT 1
    FROM expected_scores expected
    FULL JOIN student_aura_scores actual USING (student_id, lesson_date, category)
    WHERE (expected.change_id, expected.aura) IS DISTINCT FROM (actual.change_id, actual.aura)
),
expected_totals AS (
    SELECT student_id, SUM(aura)::bigint AS total_aura, COUNT(DISTINCT lesson_date)::integer AS active_days
    FROM expected_scores
    GROUP BY student_id
),
total_mismatches AS (
    SELECT 1
    FROM expected_totals expected
    FULL JOIN student_aura_totals_ready actual USING (student_id)
    WHERE (COALESCE(expected.total_aura, 0), COALESCE(expected.active_days, 0))
        IS DISTINCT FROM (COALESCE(actual.total_aura, 0), COALESCE(actual.active_days, 0))
)
SELECT
    (SELECT COUNT(*) FROM score_mismatches) AS score_mismatches,
    (SELECT COUNT(*) FROM total_mismatches) AS total_mismatches;
