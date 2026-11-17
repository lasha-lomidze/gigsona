# Gigsona

**A classroom workspace built for and actively used by an online programming academy in Georgia.**

Gigsona supports day-to-day academy workflows: mentors and assistants record daily student scores, while students and staff review progress across groups and lesson dates. It is a real operational product shaped by classroom use, with role-based access, append-only scoring history, and a responsive interface.

## What it does

- **Overview** — compare group progress and move between lesson dates.
- **Manage** — score students across six Aura categories in a keyboard-friendly matrix, with batch updates, undo/redo, and spreadsheet export.
- **History** — review daily score changes by group and student.
- **Search and profiles** — find groups and people, and view role-appropriate profile details and stats.
- **Administration** — manage groups, students, assistants, and access according to account role.
- **Preferences** — choose a theme, region, and display scale.

Aura categories: activity, classwork, camera, attendance, Q&A, and workout.

## Built with

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 and Motion
- Better Auth for identity and sessions
- Drizzle ORM with Neon serverless PostgreSQL
- Recharts for data visualizations

Application profile data and roles are stored separately from Better Auth's identity tables. Server actions validate permissions before changing group membership or scores.

## Run locally

### Requirements

- Node.js 20.9 or newer
- npm
- A PostgreSQL database (Neon works with the serverless driver)

### Setup

```bash
git clone https://github.com/<your-username>/gigsona.git
cd gigsona
npm ci
cp .env.example .env.local
```

Set `DATABASE_URL` in `.env.local` to a development database connection string. Set `BETTER_AUTH_SECRET` to a unique random secret and `BETTER_AUTH_URL` to `http://localhost:3000` for local development.

For a new, disposable local database, create/update the schema and start the app:

```bash
npm run db:push
# Set DATABASE_URL in your shell to the same development database as .env.local.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0001_student_aura_projection.sql
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app does not ship with a public demo login. Use `npm run seed` to interactively create development accounts. If you choose the built-in demo data option, set a private `SEED_PASSWORD` in `.env.local` first. **Do not run demo seed or database-clear scripts against production data.**

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build and run TypeScript checks |
| `npm run start` | Serve the production build |
| `npm run db:push` | Sync the Drizzle schema to the configured database |
| `npm run db:migrate-members` | Run the group-membership data migration |
| `npm run seed` | Interactively create development accounts and sample data |
| `npm run clear` | Permanently clear all rows after explicit confirmation |

## Roles and access

- **Anonymous** accounts can browse public directory and group information.
- **Students** can view their progress and manage their profile.
- **Assistants** can score students in groups where they have access.
- **Mentors** can manage groups and the people assigned to them.

Authorization is enforced on the server; hiding a control in the interface is not treated as an access check.

## Deployment notes

Configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` in the hosting provider's environment settings. Use a separate production database, back it up before schema changes, and review Drizzle changes before applying them. Never commit `.env.local`, credentials, or production data.

### Leaderboard projection migration

The leaderboard and student profile ranks require `drizzle/0001_student_aura_projection.sql`.
For an existing deployment, back up the database, test the migration on a disposable copy,
then run the SQL with `psql` **before** deploying the updated application:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0001_student_aura_projection.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/check-student-aura-projection.sql
```

Both reconciliation counts must be zero. The first command is transactional and blocks
aura-history writes during the index creation and backfill; schedule a maintenance window
and check the duration on a representative copy first. It fails instead of overwriting a
nonempty projection. Existing app versions can continue writing after the migration, so
roll back application code if necessary without removing the projection.

The projection is maintained by database triggers for inserts, updates, deletes, and
truncation. Do not disable the triggers or write directly to the projection tables.
Transactions modifying aura history must use PostgreSQL's `READ COMMITTED` isolation.
`db:push` alone creates the projection tables but does not install or backfill the triggers;
the SQL migration is required even on a new database. Reconcile again after maintenance or
data imports; the check scans history and is not intended for every request.

To run the SQL integration test with `psql`, use an empty disposable database whose name
starts with `gigsona_test_`, and run from the repository root:

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/student-aura-projection.sql
```

## Project status

Gigsona is actively used by an online programming academy in Georgia. The core group, scoring, history, and account-management flows support ongoing academy operations, while the product continues to evolve based on real use.
