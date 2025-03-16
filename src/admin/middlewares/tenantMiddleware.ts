import { body, param } from "express-validator";
const validate = require("../../common/middlewares/validate");

export const createTenantValidator = [
  body("name")
    .isString()
    .exists()
    .notEmpty()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters"),
  body("schemaName")
    .isString()
    .exists()
    .notEmpty()
    .matches(/^[a-z0-9_]+$/)
    .withMessage(
      "Schema name must contain only lowercase letters, numbers, and underscores"
    ),
  validate,
];

export const requiredIdParam = [
  param("id").isUUID(4).exists().withMessage("ID must be a valid UUID"),
  validate,
];

export const updateTenantValidator = [
  param("id").isUUID(4).exists().withMessage("ID must be a valid UUID"),
  body("name")
    .isString()
    .optional()
    .notEmpty()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters"),
  body("active").isBoolean().optional(),
  validate,
];
