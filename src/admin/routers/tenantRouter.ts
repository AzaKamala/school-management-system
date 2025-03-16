import Router from "express";
import { Request, Response } from 'express';
import { createTenant, deleteTenant, getTenantBySchemaName, getTenantById, getTenants, updateTenant } from "../queries/tenantQueries";
import { createTenantValidator, requiredIdParam, updateTenantValidator } from "../middlewares/tenantMiddleware";
import TenantDTO from "../DTOs/tenantDTO";
import { createTenantSchema } from "../../utils/tenantContext";

const router = Router();

router.post('/', createTenantValidator, async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, schemaName } = req.body;

        const existingTenant = await getTenantBySchemaName(schemaName);
        if (existingTenant) {
            res.status(400).json({ error: 'Schema name already exists' });
            return;
        }

        await createTenantSchema(schemaName);
        
        const tenant = await createTenant(name, schemaName);

        res.status(201).send(TenantDTO.fromObject(tenant));
        return;
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error!' });
    }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const tenants = await getTenants();

        res.status(200).send(tenants.map(TenantDTO.fromObject));
        return;
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error!' });
        return;
    }
});

router.get('/:id', requiredIdParam, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const tenant = await getTenantById(id);
        if (!tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }

        res.status(200).send(TenantDTO.fromObject(tenant));
        return;
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error!' });
        return;
    }
});

router.put('/:id', updateTenantValidator, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, active } = req.body;

        const tenant = await getTenantById(id);
        if (!tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }

        const updatedTenant = await updateTenant(id, name, active);

        res.status(200).send(TenantDTO.fromObject(updatedTenant));
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error!' });
        return;
    }
});

router.delete('/:id', requiredIdParam, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await deleteTenant(id);

        res.status(200).json({ message: 'Tenant deleted successfully' });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error!' });
        return;
    }
});

export default router;