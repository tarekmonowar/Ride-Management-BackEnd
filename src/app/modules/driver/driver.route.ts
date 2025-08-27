import express from "express";
import { checkAuth } from "../../middleware/auth.middleware";
import { Role } from "../user/user.interface";
import { DriverController } from "./driver.controller";
import { validateRequest } from "../../middleware/validate.middleware";
import { updateAvailabilitySchema } from "./driver.validation";
const router = express.Router();

router.get(
  "/available-rides",
  checkAuth(...Object.values(Role)),
  DriverController.getAvailableRides,
);

router.patch(
  "/availability",
  validateRequest(updateAvailabilitySchema),
  checkAuth(Role.DRIVER),
  DriverController.updateAvailability,
);
router.get(
  "/currentRide",
  checkAuth(Role.DRIVER),
  DriverController.currentRide,
);

router.patch(
  "/accept/:id",
  checkAuth(Role.DRIVER),
  DriverController.acceptRide,
);

export const DriverRoutes = router;
