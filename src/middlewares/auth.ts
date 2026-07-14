import { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: Role;
      };
    }
  }
}

export const auth = (...requierdRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization?.split(" ")[1]
        : req.headers.authorization;
    if (!token) {
      throw new Error(
        "You are not Logged in. Please log in to access this resource",
      );
    }
    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);
    if (!verifiedToken.success) {
      throw new Error(verifiedToken.error);
    }

    const { id, name, email, role } = verifiedToken.data as JwtPayload;

    if (requierdRoles.length && !requierdRoles.includes(role)) {
      throw new Error("You do not have permission to access this resource");
    }
    const user = await prisma.user.findUniqueOrThrow({
      where: { id, name, email, role },
    });
    if (!user) {
      throw new Error("User Not Found");
    }
    if (user.activeStatus === "BLOCKED") {
      throw new Error("Your account is blocked, please contact at support");
    }
    req.user = {
      id,
      name,
      email,
      role,
    };
    next();
  });
};
