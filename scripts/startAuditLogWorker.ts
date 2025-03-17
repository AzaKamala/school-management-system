import * as dotenv from "dotenv";
import { startWorker } from "../src/audit/workers/auditLogWorker";

dotenv.config();

console.log("Starting standalone Audit Log Worker...");
startWorker()
  .then(() => {
    console.log("Audit Log Worker started successfully");
  })
  .catch((error) => {
    console.error("Failed to start Audit Log Worker:", error);
    process.exit(1);
  });

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down Audit Log Worker");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down Audit Log Worker");
  process.exit(0);
});
