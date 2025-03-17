import { body, param } from "express-validator";
const validate = require("../../common/middlewares/validate");

export const validateTenantId = [
  param("tenantId")
    .isUUID(4)
    .exists()
    .withMessage("Tenant ID must be a valid UUID"),
  validate,
];

export const createTenantUserValidator = [
  param("tenantId")
    .isUUID(4)
    .exists()
    .withMessage("Tenant ID must be a valid UUID"),
  body("email").isEmail().withMessage("Email must be valid"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("roles").optional().isArray().withMessage("Roles must be an array"),
  body("roles.*")
    .optional()
    .isUUID(4)
    .withMessage("Each role ID must be a valid UUID"),
  validate,
];

export const updateTenantUserValidator = [
  param("tenantId")
    .isUUID(4)
    .exists()
    .withMessage("Tenant ID must be a valid UUID"),
  param("id").isUUID(4).exists().withMessage("User ID must be a valid UUID"),
  body("email").optional().isEmail().withMessage("Email must be valid"),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("firstName")
    .optional()
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .notEmpty()
    .withMessage("Last name cannot be empty"),
  body("active").optional().isBoolean(),
  validate,
];

export const assignRoleValidator = [
  param("tenantId")
    .isUUID(4)
    .exists()
    .withMessage("Tenant ID must be a valid UUID"),
  param("id").isUUID(4).exists().withMessage("User ID must be a valid UUID"),
  body("roleId").isUUID(4).exists().withMessage("Role ID must be a valid UUID"),
  validate,
];
