import express from "express";
import { checkAuth } from "../../middleware/auth.middleware";
import { Role } from "../user/user.interface";
import { PaymentController } from "./payment.controller";

const router = express.Router();

router.post(
  "/create-intent/:rideId",
  checkAuth(Role.RIDER),
  PaymentController.createPaymentIntent,
);
router.post(
  "/confirm/:rideId",
  checkAuth(Role.RIDER),
  PaymentController.confirmPayment,
);
router.post(
  "/driver-confirm/:rideId",
  checkAuth(Role.DRIVER),
  PaymentController.driverConfirmPayment,
);

export const PaymentRoutes = router;
