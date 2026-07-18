import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import { userRoutes } from "./modules/user/user.route";
import { authRoutes } from "./modules/auth/auth.route";
import { postRoutes } from "./modules/post/post.route";
import { commentRoutes } from "./modules/comment/comment.route";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./utils/globalErrorHandler";
import { subscriptionRoutes } from "./modules/subscription/subscription.route";


const app: Application = express();
// here is the middleware we have been used
app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Prisma Press Server is running!!!");
});
// Here we'll write our API endpoint
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use(notFound)
app.use(globalErrorHandler)
export default app;
