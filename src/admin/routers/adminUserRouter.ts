import Router from "express";
import { Request, Response } from "express";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserByEmail,
  getAdminUserById,
  getAdminUsers,
  updateAdminUser,
} from "../queries/adminUserQueries";
import {
  createAdminUserValidator,
  requiredIdParam,
  updateAdminUserValidator,
} from "../middlewares/adminUserMiddleware";
import AdminUserDTO from "../DTOs/adminUserDTO";

const router = Router();

router.post(
  "/",
  createAdminUserValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, password, email, role } = req.body;

      const existingAdminUser = await getAdminUserByEmail(email);
      if (existingAdminUser) {
        res.status(400).json({ error: "Email already exists" });
        return;
      }

      const adminUser = await createAdminUser(
        email,
        password,
        firstName,
        lastName,
        role
      );

      res.status(201).send(AdminUserDTO.fromObject(adminUser));
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internanl server error!" });
    }
  }
);

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUsers = await getAdminUsers();

    res.status(200).send(adminUsers.map(AdminUserDTO.fromObject));
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error!" });
    return;
  }
});

router.get(
  "/:id",
  requiredIdParam,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const adminUser = await getAdminUserById(id);
      if (!adminUser) {
        res.status(404).json({ error: "Admin user not found" });
        return;
      }

      res.status(200).send(adminUser);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
      return;
    }
  }
);

router.put(
  "/:id",
  updateAdminUserValidator,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { firstName, lastName, password, active, email, role } = req.body;

      const adminUser = await getAdminUserById(id);
      if (!adminUser) {
        res.status(404).json({ error: "Admin user not found" });
        return;
      }

      if (email) {
        const existingAdminUserEmail = await getAdminUserByEmail(email);
        if (
          existingAdminUserEmail &&
          existingAdminUserEmail.email !== adminUser.email
        ) {
          res.status(400).json({ error: "Email already exists!" });
          return;
        }
      }

      const updatedAdminUser = await updateAdminUser(
        id,
        email,
        password,
        firstName,
        lastName,
        role,
        active
      );

      res.status(200).send(AdminUserDTO.fromObject(updatedAdminUser));
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
      return;
    }
  }
);

router.delete(
  "/:id",
  requiredIdParam,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const adminUser = await getAdminUserById(id);
      if (!adminUser) {
        res.status(404).json({ error: "Admin user not found" });
        return;
      }

      await deleteAdminUser(id);

      res.status(200).json({ message: "Admin user deleted successfully" });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
      return;
    }
  }
);

export default router;
