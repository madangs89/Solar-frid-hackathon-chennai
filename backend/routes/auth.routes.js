import express from "express";
import { googleAuth, isAuth, logout } from "../controlers/auth.controller.js";
import { authMiddelware } from "../middelware/authMiddelware.js";


const authRouter = express.Router();

authRouter.get("/is-auth", authMiddelware, isAuth);
authRouter.post("/google", googleAuth);
authRouter.post("/logout", logout);

export default authRouter;
