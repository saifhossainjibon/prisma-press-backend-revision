import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";

const logInUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const { accessToken, refreshToken } = await authService.logInUser(payload);

    sendResponse(res, {
      success: true,
      statusCode: HttpStatus.OK,
      message: "User Log In successfully",
      data: { accessToken, refreshToken },
    });
  },
);

export const authController = {
  logInUser,
};
