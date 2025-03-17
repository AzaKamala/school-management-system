import * as dotenv from "dotenv";
import { consumeLoginEvents, LoginEvent } from "../../utils/rabbitmq";
import { createAuditLog } from "../queries/auditLogQueries";

dotenv.config();

async function processLoginEvent(event: LoginEvent) {
  try {
    console.log(
      `Processing login event: ${event.action} - ${event.status} for ${event.email}`
    );

    await createAuditLog(event);
    console.log(`Audit log created for tenant ${event.tenantId}`);
  } catch (error) {
    console.error("Error processing login event:", error);
    throw error;
  }
}

async function startWorker() {
  try {
    console.log("Starting Audit Log Worker...");
    await consumeLoginEvents(processLoginEvent);
    console.log("Audit Log Worker started successfully");
  } catch (error) {
    console.error("Failed to start Audit Log Worker:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down audit log worker");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down audit log worker");
  process.exit(0);
});

if (require.main === module) {
  startWorker();
}

export { startWorker, processLoginEvent };
