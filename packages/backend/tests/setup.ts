import { config } from "dotenv";

// Load test environment
config({ path: "../../.env" });
process.env.NODE_ENV = "test";
