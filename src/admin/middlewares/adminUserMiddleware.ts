import { body, param } from 'express-validator';
const validate = require('./validate');

export const createUser = [
    body('email').isString().exists().notEmpty().isEmail().withMessage('Email must be a valid email address'),
    body('firstName').isString().exists().notEmpty().isLength({ min: 3, max: 40 }).withMessage('First name must be between 3 and 40 characters'),
    body('lastName').isString().exists().notEmpty().isLength({ min: 3, max: 40 }).withMessage('Last name must be between 3 and 40 characters'),
    body('role').isString().exists(),
    body('password').isString().exists().notEmpty().isLength({ min: 8 }).withMessage('Password must be more than 8 characters'),
    validate
];

export const requiredIdParam = [
    param('id').isUUID(4).exists().withMessage('ID must be a valid UUID'),
    validate
];

export const updateUser = [
    param('id').isUUID(4).exists().withMessage('ID must be a valid UUID'),
    body('email').isString().optional().notEmpty().isEmail().withMessage('Email must be a valid email address'),
    body('firstName').isString().optional().notEmpty().isLength({ min: 3, max: 40 }).withMessage('First name must be between 3 and 40 characters'),
    body('lastName').isString().optional().notEmpty().isLength({ min: 3, max: 40 }).withMessage('Last name must be between 3 and 40 characters'),
    body('role').isString().optional(),
    body('active').isBoolean().optional(),
    body('password').isString().optional().notEmpty().isLength({ min: 8 }).withMessage('Password must be more than 8 characters'),
    validate
];