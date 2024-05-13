import { db, schema } from "../../db/client";
// import { ENV_CONFIG } from "../../env.config";
import { sql } from "drizzle-orm";
export default async () => {
  // if (!["development"].includes(ENV_CONFIG.NODE_ENV)) {
  //   console.log("🚫 Aborting for for non-development environment!");
  //   return;
  // }

  const tablesFromKeys = Object.keys(schema)
    .reverse()
    .filter((x) => x.includes("Relations") === false);

  const queries = tablesFromKeys.map((table) => {
    return sql.raw(`DELETE FROM "${table}";`);
  });

  await db.transaction(async (trx) => {
    await Promise.all(
      queries.map(async (query) => {
        if (query) await trx.run(query);
      })
    );
  });
  console.log("✅ Database emptied");
};
