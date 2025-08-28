import { RideStatus } from "../ride/ride.interface";

export interface IRidePaymentSummary {
  totalCompletedRides: number;
  totalCompletedPayments: number;
  totalPendingRides: number;
  totalPendingPayments: number;
  ridesByStatus: {
    [key in RideStatus]: {
      count: number;
      totalPayment: number;
    };
  };
}
