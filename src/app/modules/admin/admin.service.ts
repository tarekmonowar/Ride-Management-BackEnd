import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { RideStatus } from "../ride/ride.interface";
import { Ride } from "../ride/ride.model";
import { IRidePaymentSummary } from "./admin.interface";

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

export const AdminService = {
  getPaymentsHistory,
  getStatistics,
};
