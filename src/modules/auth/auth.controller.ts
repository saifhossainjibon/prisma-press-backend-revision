import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";

const logInUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const { accessToken, refreshToken } = await authService.logInUser(payload);
    // set the cookie for login
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 // 24 hour
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 day
    });
    
    sendResponse(res, {
      success: true,
      statusCode: HttpStatus.OK,
      message: "User Log In successfully",
      data: { accessToken, refreshToken },
    });
  },
);


const refreshToken = catchAsync(async (req : Request, res : Response, next : NextFunction) => {
    const refreshToken= req.cookies.refreshToken
    const {accessToken} = await authService.refreshToken(refreshToken);
    
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 // 24 hour
    });
    sendResponse(res, {
      success: true,
      statusCode: HttpStatus.OK,
      message: "Token refresh successfully",
      data: {accessToken} 
    });
})
export const authController = {
  logInUser, refreshToken
};
