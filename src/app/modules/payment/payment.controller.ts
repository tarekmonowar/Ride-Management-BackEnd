import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { PaymentService } from "./payment.service";

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const { rideId } = req.params;
  const result = await PaymentService.createPaymentIntent(
    rideId,
    decodeToken.userId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment intent created",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const { rideId } = req.params;
  const { paymentMethod, stripePaymentId } = req.body;
  const result = await PaymentService.confirmPayment(
    rideId,
    decodeToken.userId,
    paymentMethod,
    stripePaymentId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment confirmed",
    data: result,
  });
});

const driverConfirmPayment = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const { rideId } = req.params;
  const result = await PaymentService.driverConfirmPayment(
    rideId,
    decodeToken.userId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment confirmed by driver",
    data: result,
  });
});

export const PaymentController = {
  createPaymentIntent,
  confirmPayment,
  driverConfirmPayment,
};
