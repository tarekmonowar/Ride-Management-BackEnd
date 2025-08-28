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

export const AdminController = {
  getPaymentsHistory,
  getStatistics,
};
