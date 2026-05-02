import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/queryBuilder";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { userSearchableFields } from "./user.constant";

//*--------------------------------------------------------- create user------------------------------------------------
const createUser = async (payload: Partial<IUser> & { vehicleInfo?: any }) => {
  const { email, password, vehicleInfo, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(password as string, 10);

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const userData: any = {
    email,
    password: hashedPassword,
    auths: [authProvider],
    ...rest,
  };

  if (vehicleInfo) {
    userData.vehicle = vehicleInfo;
  }

  if (rest.role === Role.DRIVER) {
    userData.isApproved = false;
    userData.applicationStatus = "pending";
  }

  const user = await User.create(userData);

  const userWithoutPassword = user?.toObject();
  delete userWithoutPassword.password;
  return userWithoutPassword;
};

//*---------------------------------------------------------------update user------------------------------------------------------
const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload,
) => {
  //user and guid cannot update others
  if (decodedToken.role === Role.RIDER || decodedToken.role === Role.DRIVER) {
    if (userId !== decodedToken.userId) {
      throw new AppError(401, "You are not authorized");
    }
  }

  const ifUserExist = await User.findById(userId);

  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  //admin trying to update super-admin
  if (
    decodedToken.role === Role.ADMIN &&
    ifUserExist.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(401, "You are not authorized");
  }

  //its work when update role i mean payload.role
  if (payload.role) {
    if (decodedToken.role === Role.DRIVER || decodedToken.role === Role.RIDER) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  //its work when user want update there isactive/is deleted status
  if (payload.isBlocked || payload.isApproved || payload.isVerified) {
    if (decodedToken.role === Role.DRIVER || decodedToken.role === Role.RIDER) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  const userWithoutPassword = newUpdatedUser?.toObject();
  delete userWithoutPassword?.password;

  return userWithoutPassword;
};

//*---------------------------------------------------------------get all users------------------------------------------------
const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);
  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  // remove password from each user
  const usersWithoutPassword = data.map((user) => {
    const userObj = user.toObject?.() || user;
    delete userObj.password;
    return userObj;
  });

  return {
    data: usersWithoutPassword,
    meta,
  };
};

//*---------------------------------------------------------------get me------------------------------------------------

const getMe = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user,
  };
};
//*---------------------------------------------------------------get single users------------------------------------------------

const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user,
  };
};

//All exports
export const UserServices = {
  createUser,
  updateUser,
  getAllUsers,
  getSingleUser,
  getMe,
};
