import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { AdminService } from "./admin.service";

//*--------------------------------------------------------getPaymentsHistory--------------------------------------------

const getPaymentsHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getPaymentsHistory();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All payments retrieved successfully",
    data: result,
  });
});

//*--------------------------------------------------------getStatistics--------------------------------------------

const getStatistics = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getStatistics();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Statistics retrieved successfully",
    data: result,
  });
});

//*--------------------------------------------------------reviewDriver--------------------------------------------

const reviewDriver = catchAsync(async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { action, reason } = req.body;
  const result = await AdminService.reviewDriver(driverId, action, reason);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Driver ${action === "approve" ? "approved" : "rejected"} successfully`,
    data: result,
  });
});

//*--------------------------------------------------------getSettlements--------------------------------------------

const getSettlements = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getSettlements();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Settlements retrieved successfully",
    data: result,
  });
});

//*--------------------------------------------------------settleDriver--------------------------------------------

const settleDriver = catchAsync(async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const result = await AdminService.settleDriver(driverId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver settled successfully",
    data: result,
  });
});

export const AdminController = {
  getPaymentsHistory,
  getStatistics,
  reviewDriver,
  getSettlements,
  settleDriver,
};
