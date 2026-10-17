import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

const rl = readline.createInterface({ input, output });

const main = async () => {
    console.log("\n--- Clear Database Rows ---\n");
    console.log("This removes all rows from academy and Better Auth tables, but keeps the tables and schema.\n");

    const confirmation = (await rl.question('Type "CLEAR" to permanently continue: ')).trim();
    if (confirmation !== "CLEAR") {
        console.log("\nCancelled. No rows were changed.\n");
        return;
    }

    await db.execute(sql.raw(`
        TRUNCATE TABLE
            "auras",
            "group_members",
            "students",
            "assistants",
            "groups",
            "mentors",
            "profiles",
            "sessions",
            "accounts",
            "verifications",
            "users"
        RESTART IDENTITY CASCADE
    `));

    console.log("\nAll rows cleared. Tables and schema were preserved.\n");
};

main()
    .catch((error) => {
        console.error("Database clear failed:", error);
        process.exitCode = 1;
    })
    .finally(() => rl.close());