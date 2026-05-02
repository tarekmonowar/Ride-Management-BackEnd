import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { RideStatus } from "../ride/ride.interface";
import { Ride } from "../ride/ride.model";
import { IRidePaymentSummary } from "./admin.interface";
import { User } from "../user/user.model";
import { sendEmail } from "../../utils/sendEmail";

//*-----------------------------------------------------------------getPaymentsHistory------------------------------------------

const getPaymentsHistory = async () => {
  // Fetch all rides
  const rides = await Ride.find();

  if (!rides.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "No rides found");
  }

  // Initialize summary
  const summary: IRidePaymentSummary = {
    totalCompletedRides: 0,
    totalCompletedPayments: 0,
    totalPendingRides: 0,
    totalPendingPayments: 0,
    cashTotal: 0,
    stripeTotal: 0,
    ridesByStatus: {
      REQUESTED: { count: 0, totalPayment: 0 },
      ACCEPTED: { count: 0, totalPayment: 0 },
      PICKED_UP: { count: 0, totalPayment: 0 },
      IN_TRANSIT: { count: 0, totalPayment: 0 },
      COMPLETED: { count: 0, totalPayment: 0 },
      CANCELLED: { count: 0, totalPayment: 0 },
    },
  };

  rides.forEach((ride) => {
    const status = ride.status as RideStatus;
    summary.ridesByStatus[status].count += 1;

    // Add ride payment only if ride has estimatedCost
    const cost = ride.estimatedCost || 0;
    summary.ridesByStatus[status].totalPayment += cost;

    // Completed rides
    if (status === RideStatus.COMPLETED) {
      summary.totalCompletedRides += 1;
      summary.totalCompletedPayments += cost;
    }

    // Pending rides (all except COMPLETED and CANCELLED)
    if (status !== RideStatus.COMPLETED && status !== RideStatus.CANCELLED) {
      summary.totalPendingRides += 1;
      summary.totalPendingPayments += cost;
    }

    // Payment method breakdown (only for paid/confirmed rides)
    if (
      status === RideStatus.COMPLETED &&
      (ride.paymentStatus === "paid" ||
        ride.paymentStatus === "driver_confirmed")
    ) {
      if (ride.paymentMethod === "cash") {
        summary.cashTotal += cost;
      } else if (ride.paymentMethod === "stripe") {
        summary.stripeTotal += cost;
      }
    }
  });

  return summary;
};

//*-----------------------------------------------------------------getStatistics------------------------------------------

const getStatistics = async () => {
  const now = new Date();

  // --- Last 7 Days ---
  const last7Days = await Ride.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().setDate(now.getDate() - 6)) },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        totalRides: { $sum: 1 },
        totalPayments: { $sum: { $ifNull: ["$estimatedCost", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill missing days (so frontend always gets 7 entries)
  const last7DaysFilled: {
    date: string;
    totalRides: number;
    totalPayments: number;
  }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(new Date().setDate(now.getDate() - i))
      .toISOString()
      .split("T")[0];
    const found = last7Days.find((d) => d._id === date);
    last7DaysFilled.push({
      date,
      totalRides: found?.totalRides || 0,
      totalPayments: found?.totalPayments || 0,
    });
  }

  // --- Last 12 Months ---
  const last12Months = await Ride.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setFullYear(now.getFullYear() - 1)),
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$createdAt" },
        },
        totalRides: { $sum: 1 },
        totalPayments: { $sum: { $ifNull: ["$estimatedCost", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill missing months (so always 12 months in order)
  const last12MonthsFilled: {
    month: string;
    totalRides: number;
    totalPayments: number;
  }[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(new Date().setMonth(now.getMonth() - i));
    const month = date.toISOString().slice(0, 7); // YYYY-MM
    const found = last12Months.find((m) => m._id === month);
    last12MonthsFilled.push({
      month,
      totalRides: found?.totalRides || 0,
      totalPayments: found?.totalPayments || 0,
    });
  }

  return {
    last7Days: last7DaysFilled,
    last12Months: last12MonthsFilled,
  };
};

//*-----------------------------------------------------------------reviewDriver------------------------------------------

const reviewDriver = async (
  driverId: string,
  action: "approve" | "reject",
  reason?: string,
) => {
  const driver = await User.findById(driverId);
  if (!driver) throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  if (driver.role !== "DRIVER")
    throw new AppError(httpStatus.BAD_REQUEST, "User is not a driver");

  if (action === "approve") {
    driver.isApproved = true;
    driver.applicationStatus = "approved";
    driver.rejectionReason = undefined;
    await driver.save();
    // send approval email
    await sendEmail({
      to: driver.email,
      subject: "Driver Application Approved - RideFlow",
      templateName: "driverApproved",
      templateData: { name: driver.name },
    });
  } else {
    driver.isApproved = false;
    driver.applicationStatus = "rejected";
    driver.rejectionReason =
      reason || "Your application did not meet our requirements.";
    await driver.save();
    await sendEmail({
      to: driver.email,
      subject: "Driver Application Update - RideFlow",
      templateName: "driverRejected",
      templateData: { name: driver.name, reason: driver.rejectionReason },
    });
  }
  const result = driver.toObject();
  delete result.password;
  return result;
};

//*-----------------------------------------------------------------getSettlements------------------------------------------

const getSettlements = async () => {
  const settlements = await Ride.aggregate([
    {
      $match: {
        status: RideStatus.COMPLETED,
        paymentStatus: { $in: ["paid", "driver_confirmed"] },
      },
    },
    {
      $group: {
        _id: "$driver",
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: "$estimatedCost" },
        cashRides: {
          $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0] },
        },
        cashTotal: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$estimatedCost", 0],
          },
        },
        stripeTotal: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "stripe"] }, "$estimatedCost", 0],
          },
        },
        unsettledCash: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$paymentMethod", "cash"] },
                  { $eq: ["$isSettled", false] },
                ],
              },
              "$estimatedCost",
              0,
            ],
          },
        },
        settledCash: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$paymentMethod", "cash"] },
                  { $eq: ["$isSettled", true] },
                ],
              },
              "$estimatedCost",
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "driverInfo",
      },
    },
    { $unwind: "$driverInfo" },
    {
      $project: {
        driverId: "$_id",
        driverName: "$driverInfo.name",
        driverEmail: "$driverInfo.email",
        totalRides: 1,
        totalEarnings: 1,
        cashRides: 1,
        cashTotal: 1,
        stripeTotal: 1,
        unsettledCash: 1,
        settledCash: 1,
      },
    },
  ]);
  return settlements;
};

//*-----------------------------------------------------------------settleDriver------------------------------------------

const settleDriver = async (driverId: string) => {
  const result = await Ride.updateMany(
    {
      driver: driverId,
      paymentMethod: "cash",
      isSettled: false,
      status: RideStatus.COMPLETED,
      paymentStatus: "driver_confirmed",
    },
    { $set: { isSettled: true } },
  );
  return { modifiedCount: result.modifiedCount };
};

export const AdminService = {
  getPaymentsHistory,
  getStatistics,
  reviewDriver,
  getSettlements,
  settleDriver,
};
