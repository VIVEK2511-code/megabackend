import { Router } from "express";
import { registerUser } from "../controllers/auth.controllers.js"
import {validate} from "../middlewares/validator_middleware.js"
import { userRegistrationValidator } from"../validator/index.js";





const router=Router()




router.route("/register").post(authChecker,registerUser);


export default router
