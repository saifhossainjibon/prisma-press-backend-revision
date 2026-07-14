import { NextFunction, Request, Response } from "express";
import HttpStatus from "http-status";
import { userService } from "./users.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const user = await userService.registerUserIntoDB(payload);
    sendResponse(res, {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: "User registered successfully",
      data: { user },
    });
  },
);

const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // console.log(req.user)
  const profile = await userService.getMyProfileFromDB(req.user?.id as string);

  sendResponse(res, {
    success: true,
    statusCode: HttpStatus.OK,
    message: "User profile fetched successfully",
    data: { profile },
  });
};

const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id as string;
  const payload = req.body;
  const updatedProfile = await userService.updateMyProfileIntoDB(
    userId,
    payload,
  );
  sendResponse(res, {
    success: true,
    statusCode: HttpStatus.OK,
    message: "User Updated successfully",
    data: { updatedProfile },
  });
};
export const userController = {
  registerUser,
  getMyProfile,
  updateMyProfile,
};
