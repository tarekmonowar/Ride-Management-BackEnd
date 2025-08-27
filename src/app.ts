import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import "./app/config/passport";
import { router } from "./app/routes";
import { envVars } from "./app/config/env";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";

const app = express();

// Middleware for parsing JSON and URL-encoded data  body-parser lage na
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(
  session({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Setting up routes
app.use("/api/v1", router);

// Home route
app.get("/", (req: Request, res: Response) => {
  res.send("API Working with /api/v1 for Ride Booking BackEnd");
});

// Catch-all route for undefined routes
app.use(notFound);

// Middleware for error handling
app.use(globalErrorHandler);

export default app;
