import z from "zod";
import { Role } from "./user.interface";

//user register ZOD validations
export const createUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  email: z
    .string()
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter.",
    })
    .regex(/^(?=.*[!@#$%^&*])/, {
      message: "Password must contain at least 1 special character.",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least 1 number.",
    }),
  phone: z
    .string()

    .optional(),

  address: z
    .string()
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
});

//user Update ZOD validations
export const updateUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional(),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message:
        "Phone number must be a valid international number in E.164 format",
    })
    .optional(),

  role: z.enum(Object.values(Role) as [string]).optional(),
  isBlocked: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  vehicle: z
    .object({
      model: z.string().min(1, "Model is required"),
      licensePlate: z.string().min(1, "License plate is required"),
    })
    .optional(),

  address: z
    .string()
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
});
