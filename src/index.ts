import express from "express";
import adminUserRouter from "./admin/routers/adminUserRouter";
import tenantRouter from "./admin/routers/tenantRouter";
import userRouter from "./tenant/routers/userRouter";
import authRouter from "./auth/routes/authRouter";
import oauthRouter from "./auth/routes/oauthRouter";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/admin-user", adminUserRouter);
app.use("/tenant", tenantRouter);
app.use("/tenant/:tenantId/user", userRouter);
app.use("/auth", authRouter);
app.use("/auth/oauth", oauthRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
