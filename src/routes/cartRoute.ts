import express  from "express";
import { getActiveCartForUser } from "../services/cartService";
import validateJWT from "../middlewares/validateJWT";

const router = express.Router();



router.get('/',validateJWT ,async (req,res) => {
    // TO DO : get the userId from the jwt , after validating from middleware. 
    const cart = await getActiveCartForUser({userId:"xxx"})
    res.status(200).send(cart);

})


export default router;