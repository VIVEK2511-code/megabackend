import app from "./app.js"

import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:"../.env"
})
const port=process.env.PORT||8000;
connectDB()
            .then(()=>{
                app.listen(port,()=>console.log(`server is running on port:${port}`));
            })
            .catch((err)=>{
             console.error("Mongodb connection error",err);
             process.exit(1)   
            })

