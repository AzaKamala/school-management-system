import express from "express";
import adminUserRouter from "./admin/routers/adminUserRouter";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/admin-user', adminUserRouter);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});