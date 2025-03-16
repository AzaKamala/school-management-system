import { body, param } from 'express-validator';
const validate = require('../../common/middlewares/validate');

export const validateTenantId = [
  param('tenantId').isUUID(4).exists().withMessage('Tenant ID must be a valid UUID'),
  validate
];

export const createTenantUserValidator = [
  param('tenantId').isUUID(4).exists().withMessage('Tenant ID must be a valid UUID'),
  body('email').isEmail().withMessage('Email must be valid'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['TENANT_ADMIN', 'TEACHER', 'STUDENT']).withMessage('Role must be TENANT_ADMIN, TEACHER, or STUDENT'),
  validate
];

export const updateTenantUserValidator = [
  param('tenantId').isUUID(4).exists().withMessage('Tenant ID must be a valid UUID'),
  param('id').isUUID(4).exists().withMessage('User ID must be a valid UUID'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['TENANT_ADMIN', 'TEACHER', 'STUDENT']).withMessage('Role must be TENANT_ADMIN, TEACHER, or STUDENT'),
  body('active').optional().isBoolean(),
  validate
];