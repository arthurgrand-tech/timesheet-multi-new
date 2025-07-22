import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Throw an error if the DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing. Please define it in your .env file.");
}

// Export Drizzle configuration
export default defineConfig({
  out: "./migrations", // Folder where migration files will be saved
  schema: "./shared/schema.ts", // Path to your schema file
  dialect: "postgresql", // Database dialect
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
