import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { subscriptionService } from "./subscription.service";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";

const createCheckoutSession = catchAsync(
    async(req:Request, res: Response, next: NextFunction)=>{
        const userId =req.user?.id;
        const result= await subscriptionService.createCheckoutSession(userId as string);

        sendResponse(res, {
        success: true,
        statusCode: HttpStatus.OK,
        message: "Checkout Completed Successfully",
        data: result,
        });
    }
)
export const subscriptionController ={
    createCheckoutSession
}