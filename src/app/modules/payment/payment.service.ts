import Stripe from "stripe";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Ride } from "../ride/ride.model";
import { RideStatus } from "../ride/ride.interface";
import { User } from "../user/user.model";
import { Role } from "../user/user.interface";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2024-12-18.acacia",
});

const createPaymentIntent = async (rideId: string, userId: string) => {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  if (ride.rider.toString() !== userId)
    throw new AppError(httpStatus.FORBIDDEN, "Not your ride");
  if (ride.status !== RideStatus.COMPLETED)
    throw new AppError(httpStatus.BAD_REQUEST, "Ride is not completed yet");
  if (
    ride.paymentStatus === "paid" ||
    ride.paymentStatus === "driver_confirmed"
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment already processed");
  }

  const amount = Math.round((ride.estimatedCost || 0) * 100); // cents
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    metadata: { rideId: rideId, userId: userId },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    amount: ride.estimatedCost,
  };
};

const confirmPayment = async (
  rideId: string,
  userId: string,
  paymentMethod: "stripe" | "cash",
  stripePaymentId?: string,
) => {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  if (ride.rider.toString() !== userId)
    throw new AppError(httpStatus.FORBIDDEN, "Not your ride");
  if (ride.status !== RideStatus.COMPLETED)
    throw new AppError(httpStatus.BAD_REQUEST, "Ride not completed");
  if (
    ride.paymentStatus === "paid" ||
    ride.paymentStatus === "driver_confirmed"
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment already processed");
  }

  ride.paymentMethod = paymentMethod;
  if (paymentMethod === "stripe") {
    ride.paymentStatus = "paid";
    if (stripePaymentId) ride.stripePaymentId = stripePaymentId;
  } else {
    ride.paymentStatus = "paid";
  }
  await ride.save();
  return ride;
};

const driverConfirmPayment = async (rideId: string, driverId: string) => {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  if (!ride.driver || ride.driver.toString() !== driverId)
    throw new AppError(httpStatus.FORBIDDEN, "Not your ride");
  if (ride.paymentStatus !== "paid")
    throw new AppError(httpStatus.BAD_REQUEST, "Payment not yet made by rider");

  ride.paymentStatus = "driver_confirmed";
  await ride.save();
  return ride;
};

export const PaymentService = {
  createPaymentIntent,
  confirmPayment,
  driverConfirmPayment,
};
