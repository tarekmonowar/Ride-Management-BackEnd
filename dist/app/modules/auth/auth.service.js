"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const userTokens_1 = require("../../utils/userTokens");
const user_model_1 = require("../user/user.model");
const sendEmail_1 = require("../../utils/sendEmail");
//*---------------------------------------------Refresh Token----------------------------
const getNewAccessToken = async (refreshToken) => {
    const newAccessToken = await (0, userTokens_1.createNewAccessTokenWithRefreshToken)(refreshToken);
    return {
        accessToken: newAccessToken,
    };
};
//*---------------------------------------------change Password ----------------------------
const changePassword = async (oldPassword, newPassword, decodedToken) => {
    // console.log("Decoded Token:", decodedToken);
    // 1. Find user by ID from token
    const user = await user_model_1.User.findById(decodedToken.userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    // 2. Compare old password
    const isOldPasswordMatch = await bcryptjs_1.default.compare(oldPassword, user?.password);
    if (!isOldPasswordMatch) {
        throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Old password does not match");
    }
    // 3. Hash the new password
    const newHashedPassword = await bcryptjs_1.default.hash(newPassword, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    // 4. Save new password
    user.password = newHashedPassword;
    await user.save();
    return {
        message: "Password updated successfully",
    };
};
//*---------------------------------------------Set Password ----------------------------
const setPassword = async (userId, plainPassword) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.password &&
        user.auths.some((providerObject) => providerObject.provider === "google")) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You have already set password,please change your password");
    }
    if (!plainPassword) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Password not received");
    }
    const hashedPassword = await bcryptjs_1.default.hash(plainPassword, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    const credentialProvider = {
        provider: "credentials",
        providerId: user.email,
    };
    const auth = [...user.auths, credentialProvider];
    user.password = hashedPassword;
    user.auths = auth;
    await user.save();
    return {
        message: "Password updated successfully",
    };
};
//*---------------------------------------------forget Password ----------------------------
const forgotPassword = async (email) => {
    const isUserExist = await user_model_1.User.findOne({ email });
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Not Exist");
    }
    if (!isUserExist.isVerified) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is not Verified");
    }
    if (isUserExist.isBlocked === true) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `User is blocked`);
    }
    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role,
    };
    const resetToken = jsonwebtoken_1.default.sign(jwtPayload, env_1.envVars.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
    });
    const resetUILink = `${env_1.envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;
    await (0, sendEmail_1.sendEmail)({
        to: isUserExist.email,
        subject: "Password Reset",
        templateName: "forgetPassword",
        templateData: {
            name: isUserExist.name,
            resetUILink,
        },
    });
};
//*---------------------------------------------reset Password ----------------------------
const resetPassword = async (payload, decodedToken) => {
    if (payload.id != decodedToken.userId) {
        throw new AppError_1.default(401, "You cannot reset your password..invalid ID ");
    }
    const isUserExist = await user_model_1.User.findById(decodedToken.userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Not Exist");
    }
    const hashedPassword = await bcryptjs_1.default.hash(payload.newPassword, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    isUserExist.password = hashedPassword;
    await isUserExist.save();
};
//*---------------------------------------------All exports----------------------------
exports.AuthServices = {
    getNewAccessToken,
    resetPassword,
    setPassword,
    forgotPassword,
    changePassword,
};
