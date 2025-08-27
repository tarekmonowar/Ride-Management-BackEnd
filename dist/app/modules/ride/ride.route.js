"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validate_middleware_1 = require("../../middleware/validate.middleware");
const ride_validation_1 = require("./ride.validation");
const ride_controller_1 = require("./ride.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const user_interface_1 = require("../user/user.interface");
const router = express_1.default.Router();
// Rider routes
router.post("/rider-request", (0, validate_middleware_1.validateRequest)(ride_validation_1.createRideZodSchema), (0, auth_middleware_1.checkAuth)(...Object.values(user_interface_1.Role)), ride_controller_1.RideController.createRide);
router.get("/activeRide", (0, auth_middleware_1.checkAuth)(...Object.values(user_interface_1.Role)), ride_controller_1.RideController.activeRide);
router.patch("/ride-cancel/:id", (0, validate_middleware_1.validateRequest)(ride_validation_1.updateRideStatusSchema), (0, auth_middleware_1.checkAuth)(...Object.values(user_interface_1.Role)), ride_controller_1.RideController.cancelRide);
router.get("/rider-history", (0, auth_middleware_1.checkAuth)(...Object.values(user_interface_1.Role)), ride_controller_1.RideController.getRideHistory);
//admin route
router.get("/all-rides", (0, auth_middleware_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), ride_controller_1.RideController.getAllRides);
// Driver routes
router.get("/driver-history", (0, auth_middleware_1.checkAuth)(user_interface_1.Role.DRIVER), ride_controller_1.RideController.driverHistory);
router.patch("/update-status/:id", (0, validate_middleware_1.validateRequest)(ride_validation_1.updateRideStatusSchema), (0, auth_middleware_1.checkAuth)(user_interface_1.Role.DRIVER), ride_controller_1.RideController.updateRideStatus);
exports.RideRoutes = router;
