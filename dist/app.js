"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
require("./app/config/passport");
const routes_1 = require("./app/routes");
const env_1 = require("./app/config/env");
const globalErrorHandler_1 = require("./app/middleware/globalErrorHandler");
const notFound_1 = require("./app/middleware/notFound");
const app = (0, express_1.default)();
// Middleware for parsing JSON and URL-encoded data  body-parser lage na
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.set("trust proxy", 1);
app.use((0, cors_1.default)({
    origin: env_1.envVars.FRONTEND_URL,
    credentials: true,
}));
app.use((0, express_session_1.default)({
    secret: env_1.envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Setting up routes
app.use("/api/v1", routes_1.router);
// Home route
app.get("/", (req, res) => {
    res.send("API Working with /api/v1 for Ride Booking BackEnd");
});
// Catch-all route for undefined routes
app.use(notFound_1.notFound);
// Middleware for error handling
app.use(globalErrorHandler_1.globalErrorHandler);
exports.default = app;
