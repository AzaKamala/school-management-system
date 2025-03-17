import express from "express";
import adminUserRouter from "./admin/routers/adminUserRouter";
import tenantRouter from "./admin/routers/tenantRouter";
import userRouter from "./tenant/routers/userRouter";
import authRouter from "./auth/routes/authRouter";
import oauthRouter from "./auth/routes/oauthRouter";
import auditLogRouter from "./audit/routes/auditLogRouter";
import adminAuditLogRouter from "./audit/routes/adminAuditLogRouter";
import { connectRabbitMQ } from "./utils/rabbitmq";
import { startWorker } from "./audit/workers/auditLogWorker";

const app = express();
const port = process.env.PORT || 3000;

connectRabbitMQ().catch(err => {
  console.error("Failed to connect to RabbitMQ:", err);
});

const ENABLE_WORKER = process.env.ENABLE_WORKER !== "false";
if (ENABLE_WORKER) {
  startWorker().catch(err => {
    console.error("Failed to start audit log worker:", err);
  });
}

app.use(express.json());

app.use("/admin-user", adminUserRouter);
app.use("/tenant", tenantRouter);
app.use("/tenant/:tenantId/user", userRouter);
app.use("/tenant/:tenantId/audit", auditLogRouter);
app.use("/audit/admin", adminAuditLogRouter);
app.use("/auth", authRouter);
app.use("/auth/oauth", oauthRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});