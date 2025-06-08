import { Router } from "express";
import {healthCheck} from "../controllers/headlthcheck.controllers"
const router=Router()


router.route("/").get(healthCheck)



export default router
