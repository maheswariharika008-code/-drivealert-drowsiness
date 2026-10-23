import { body, ValidationChain } from "express-validator";

export const registerValidation: ValidationChain[] = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("vehicleNumber").trim().notEmpty().withMessage("Vehicle number is required"),
];

export const loginValidation: ValidationChain[] = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidation: ValidationChain[] = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
];

export const resetPasswordValidation: ValidationChain[] = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];
