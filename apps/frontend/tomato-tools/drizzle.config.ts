import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "./src/lib/database/drizzle/schema/*",
  out: "./src/lib/database/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
