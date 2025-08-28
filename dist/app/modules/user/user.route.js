"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_interface_1 = require("./user.interface");
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
//Route api/v1/user/register
router.post("/register", (0, validate_middleware_1.validateRequest)(user_validation_1.createUserZodSchema), user_controller_1.UserControllers.createUser);
//Route api/v1/user/all-users(Admin only)
router.get("/all-users", (0, auth_middleware_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), user_controller_1.UserControllers.getAllUsers);
//Route api/v1/user/me
router.get("/me", (0, auth_middleware_1.checkAuth)(...Object.values(user_interface_1.Role)), user_controller_1.UserControllers.getMe);
//Route api/v1/user/:id(Admin only)
router.get("/:id", (0, auth_middleware_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), user_controller_1.UserControllers.getSingleUser);
//Route api/v1/user/:id
router.patch("/:id", (0, validate_middleware_1.validateRequest)(user_validation_1.updateUserZodSchema), (0, auth_middleware_1.checkAuth)(...Object.values(user_interface_1.Role)), user_controller_1.UserControllers.updateUser);
exports.UserRoutes = router;
