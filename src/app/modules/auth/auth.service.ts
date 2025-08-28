/* eslint-disable @typescript-eslint/no-explicit-any */
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { IAuthProvider } from "../user/user.interface";
import { User } from "../user/user.model";
import { sendEmail } from "../../utils/sendEmail";

//*---------------------------------------------Refresh Token----------------------------

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken,
  );
  return {
    accessToken: newAccessToken,
  };
};

//*---------------------------------------------change Password ----------------------------

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload,
) => {
  // console.log("Decoded Token:", decodedToken);

  // 1. Find user by ID from token
  const user = await User.findById(decodedToken.userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // 2. Compare old password
  const isOldPasswordMatch = await bcryptjs.compare(
    oldPassword,
    user?.password as string,
  );

  if (!isOldPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match");
  }

  // 3. Hash the new password
  const newHashedPassword = await bcryptjs.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  // 4. Save new password
  user.password = newHashedPassword;
  await user.save();

  return {
    message: "Password updated successfully",
  };
};

//*---------------------------------------------Set Password ----------------------------

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (
    user.password &&
    user.auths.some((providerObject) => providerObject.provider === "google")
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already set password,please change your password",
    );
  }

  if (!plainPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, "Password not received");
  }

  const hashedPassword = await bcryptjs.hash(
    plainPassword,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  const credentialProvider: IAuthProvider = {
    provider: "credentials",
    providerId: user.email,
  };
  const auth: IAuthProvider[] = [...user.auths, credentialProvider];

  user.password = hashedPassword;
  user.auths = auth;

  await user.save();

  return {
    message: "Password updated successfully",
  };
};
//*---------------------------------------------forget Password ----------------------------

const forgotPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });
  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Not Exist");
  }

  if (!isUserExist.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not Verified");
  }
  if (isUserExist.isBlocked === true) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is blocked`);
  }

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const resetToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });

  const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

  await sendEmail({
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
const resetPassword = async (
  payload: Record<string, any>,
  decodedToken: JwtPayload,
) => {
  if (payload.id != decodedToken.userId) {
    throw new AppError(401, "You cannot reset your password..invalid ID ");
  }

  const isUserExist = await User.findById(decodedToken.userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Not Exist");
  }

  const hashedPassword = await bcryptjs.hash(
    payload.newPassword,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  isUserExist.password = hashedPassword;

  await isUserExist.save();
};

//*---------------------------------------------All exports----------------------------
export const AuthServices = {
  getNewAccessToken,
  resetPassword,
  setPassword,
  forgotPassword,
  changePassword,
};
