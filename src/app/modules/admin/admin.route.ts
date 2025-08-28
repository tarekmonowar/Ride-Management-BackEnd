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

export const AdminRoutes = router;
