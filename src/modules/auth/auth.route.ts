import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router()
router.post("/login", authController.logInUser)
export const authRoutes = router