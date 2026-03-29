import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Welcome } from "./pages/Welcome";
import { CustomerHome } from "./pages/customer/Home";
import { CustomerFinding } from "./pages/customer/FindingDriver";
import { CustomerRide } from "./pages/customer/RideInProgress";
import { CustomerComplete } from "./pages/customer/RideComplete";
import { CustomerProfile } from "./pages/customer/Profile";
import { CustomerHistory } from "./pages/customer/History";
import { CustomerSignup } from "./pages/customer/Signup";
import { CustomerOTPVerification } from "./pages/customer/OTPVerification";
import { CustomerWallet } from "./pages/customer/Wallet";
import { CustomerNotifications } from "./pages/customer/Notifications";
import { CustomerPromos } from "./pages/customer/Promos";
import { DriverHome } from "./pages/driver/Home";
import { DriverRequest } from "./pages/driver/IncomingRequest";
import { DriverRideActive } from "./pages/driver/RideActive";
import { DriverRideDone } from "./pages/driver/RideDone";
import { DriverProfile } from "./pages/driver/Profile";
import { DriverEarnings } from "./pages/driver/Earnings";
import { DriverSignup } from "./pages/driver/Signup";
import { DriverOTPVerification } from "./pages/driver/OTPVerification";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Welcome },
      // Customer routes
      { path: "customer/signup", Component: CustomerSignup },
      { path: "customer/otp", Component: CustomerOTPVerification },
      { path: "customer/home", Component: CustomerHome },
      { path: "customer/finding", Component: CustomerFinding },
      { path: "customer/ride", Component: CustomerRide },
      { path: "customer/complete", Component: CustomerComplete },
      { path: "customer/profile", Component: CustomerProfile },
      { path: "customer/history", Component: CustomerHistory },
      { path: "customer/wallet", Component: CustomerWallet },
      { path: "customer/notifications", Component: CustomerNotifications },
      { path: "customer/promos", Component: CustomerPromos },
      // Driver routes
      { path: "driver/signup", Component: DriverSignup },
      { path: "driver/otp", Component: DriverOTPVerification },
      { path: "driver/home", Component: DriverHome },
      { path: "driver/request", Component: DriverRequest },
      { path: "driver/active", Component: DriverRideActive },
      { path: "driver/done", Component: DriverRideDone },
      { path: "driver/profile", Component: DriverProfile },
      { path: "driver/earnings", Component: DriverEarnings },
    ],
  },
]);