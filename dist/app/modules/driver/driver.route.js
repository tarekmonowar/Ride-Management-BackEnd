"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const user_interface_1 = require("../user/user.interface");
const driver_controller_1 = require("./driver.controller");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const driver_validation_1 = require("./driver.validation");
const router = express_1.default.Router();
router.get("/available-rides", (0, auth_middleware_1.checkAuth)(...Object.values(user_interface_1.Role)), driver_controller_1.DriverController.getAvailableRides);
router.patch("/availability", (0, validate_middleware_1.validateRequest)(driver_validation_1.updateAvailabilitySchema), (0, auth_middleware_1.checkAuth)(user_interface_1.Role.DRIVER), driver_controller_1.DriverController.updateAvailability);
router.get("/currentRide", (0, auth_middleware_1.checkAuth)(user_interface_1.Role.DRIVER), driver_controller_1.DriverController.currentRide);
router.patch("/accept/:id", (0, auth_middleware_1.checkAuth)(user_interface_1.Role.DRIVER), driver_controller_1.DriverController.acceptRide);
exports.DriverRoutes = router;
