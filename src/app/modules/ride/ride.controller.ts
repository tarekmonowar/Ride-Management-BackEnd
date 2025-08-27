import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RideService } from "./ride.service";
import httpStatus from "http-status-codes";

//*--------------------------------------------------------createRide--------------------------------------------
const createRide = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const decodeToken = req.user as JwtPayload;

  const result = await RideService.createRide(payload, decodeToken.userId);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Ride created successfully",
    data: result,
  });
});

//*--------------------------------------------------------activeRide--------------------------------------------
const activeRide = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;

  const result = await RideService.activeRide(decodeToken.userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ride retrieved successfully",
    data: result,
  });
});

//*--------------------------------------------------------cancelRide--------------------------------------------
const cancelRide = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const decodeToken = req.user as JwtPayload;
  const rideId = req.params.id;

  const result = await RideService.cancelRide(
    rideId,
    decodeToken.userId,
    payload,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ride canceled successfully",
    data: result,
  });
});

//*--------------------------------------------------------get rider ride history--------------------------------------------

const getRideHistory = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const query = req.query;
  const result = await RideService.getRideHistory(
    decodeToken.userId,
    query as Record<string, string>,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ride history retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

//*--------------------------------------------------------get all ride admin--------------------------------------------

const getAllRides = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await RideService.getAllRides(query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All ride retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

//*--------------------------------------------------------Driver ride history--------------------------------------------

const driverHistory = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const decodeToken = req.user as JwtPayload;

  const result = await RideService.driverHistory(
    decodeToken.userId,
    query as Record<string, string>,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All history retrieved successfully",
    data: {
      totalEarning: result.totalEarning,
      rides: result.rides,
    },
    meta: result.meta,
  });
});

//*--------------------------------------------------------Driver accept ride and update status--------------------------------------------

const updateRideStatus = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const rideId = req.params.id;
  const updateData = req.body;

  const result = await RideService.updateRideStatus(
    decodeToken.userId,
    rideId,
    updateData,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ride status updated successfully",
    data: result,
  });
});

export const RideController = {
  createRide,
  activeRide,
  cancelRide,
  getRideHistory,
  getAllRides,
  driverHistory,
  updateRideStatus,
};
