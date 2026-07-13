import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors"
import config from "./config";

const app: Application = express();
// here is the middleware we have been used 
app.use(cors({
    origin: config.app_url,
    credentials: true
}))
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.get("/",(req: Request, res: Response) => {
    res.send("Prisma Press Server is running!!!");
})
// Here we'll write our API endpoint
export default app;