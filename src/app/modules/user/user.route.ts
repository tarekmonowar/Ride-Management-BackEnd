import express from "express";
import { Role } from "./user.interface";
import { UserControllers } from "./user.controller";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { validateRequest } from "../../middleware/validate.middleware";
import { checkAuth } from "../../middleware/auth.middleware";

const router = express.Router();

//Route api/v1/user/register
router.post(
  "/register",
  validateRequest(createUserZodSchema),
  UserControllers.createUser,
);

//Route api/v1/user/all-users(Admin only)
router.get(
  "/all-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllUsers,
);

//Route api/v1/user/me
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);

//Route api/v1/user/:id(Admin only)
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getSingleUser,
);

//Route api/v1/user/:id
router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(...Object.values(Role)),
  UserControllers.updateUser,
);

export const UserRoutes = router;
