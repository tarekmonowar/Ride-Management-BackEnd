import express from "express";
import { validateRequest } from "../../middleware/validate.middleware";
import { createRideZodSchema, updateRideStatusSchema } from "./ride.validation";
import { RideController } from "./ride.controller";
import { checkAuth } from "../../middleware/auth.middleware";
import { Role } from "../user/user.interface";

const router = express.Router();

// Rider routes
router.post(
  "/rider-request",
  validateRequest(createRideZodSchema),
  checkAuth(...Object.values(Role)),
  RideController.createRide,
);

router.get(
  "/activeRide",
  checkAuth(...Object.values(Role)),
  RideController.activeRide,
);

router.patch(
  "/ride-cancel/:id",
  validateRequest(updateRideStatusSchema),
  checkAuth(...Object.values(Role)),
  RideController.cancelRide,
);

router.get(
  "/rider-history",
  checkAuth(...Object.values(Role)),
  RideController.getRideHistory,
);

//admin route
router.get(
  "/all-rides",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  RideController.getAllRides,
);

// Driver routes

router.get(
  "/driver-history",
  checkAuth(Role.DRIVER),
  RideController.driverHistory,
);

router.patch(
  "/update-status/:id",
  validateRequest(updateRideStatusSchema),
  checkAuth(Role.DRIVER),
  RideController.updateRideStatus,
);

export const RideRoutes = router;
