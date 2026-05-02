import express from "express";
import { checkAuth } from "../../middleware/auth.middleware";
import { Role } from "../user/user.interface";
import { AdminController } from "./admin.controller";
const router = express.Router();

router.get(
  "/payments-history",
  checkAuth(...Object.values(Role)),
  AdminController.getPaymentsHistory,
);
router.get(
  "/statistics",
  checkAuth(...Object.values(Role)),
  AdminController.getStatistics,
);
router.patch(
  "/review-driver/:driverId",
  checkAuth(Role.SUPER_ADMIN),
  AdminController.reviewDriver,
);
router.get(
  "/settlements",
  checkAuth(Role.SUPER_ADMIN),
  AdminController.getSettlements,
);
router.post(
  "/settle/:driverId",
  checkAuth(Role.SUPER_ADMIN),
  AdminController.settleDriver,
);

export const AdminRoutes = router;
