import express from 'express';
import { Request, Response } from 'express';
import {
  createTenantUser,
  deleteTenantUser,
  getTenantUserByEmail,
  getTenantUserById,
  getTenantUsers,
  updateTenantUser,
} from '../queries/userQueries';
import {
  createTenantUserValidator,
  updateTenantUserValidator,
  validateTenantId,
} from '../middlewares/userMiddleware';
import TenantUserDTO from '../DTOs/userDTO';
import { getTenantById } from '../../admin/queries/tenantQueries';

const router = express.Router({ mergeParams: true });

router.post('/', createTenantUserValidator, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.params;
    const { email, password, firstName, lastName, role } = req.body;

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const existingUser = await getTenantUserByEmail(tenantId, email);
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists in this tenant' });
      return;
    }

    const user = await createTenantUser(tenantId, email, password, firstName, lastName, role);

    res.status(201).json(TenantUserDTO.fromObject(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', validateTenantId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.params;

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const users = await getTenantUsers(tenantId);

    res.status(200).json(users.map(TenantUserDTO.fromObject));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', validateTenantId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, id } = req.params;

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const user = await getTenantUserById(tenantId, id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(TenantUserDTO.fromObject(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', updateTenantUserValidator, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, id } = req.params;
    const { email, password, firstName, lastName, role, active } = req.body;

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const existingUser = await getTenantUserById(tenantId, id);
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (email && email !== existingUser.email) {
      const userWithEmail = await getTenantUserByEmail(tenantId, email);
      if (userWithEmail) {
        res.status(400).json({ error: 'Email already exists in this tenant' });
        return;
      }
    }

    const updatedUser = await updateTenantUser(tenantId, id, {
      email,
      password,
      firstName,
      lastName,
      role,
      active,
    });

    res.status(200).json(TenantUserDTO.fromObject(updatedUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', validateTenantId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, id } = req.params;

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const existingUser = await getTenantUserById(tenantId, id);
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await deleteTenantUser(tenantId, id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;