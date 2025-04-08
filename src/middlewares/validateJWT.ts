import { NextFunction,Response,Request } from "express";

const validateJWT = (req:Request,res:Response,next:NextFunction)=>{
    const authorizationHeader = req.get('authorization');
    if(!authorizationHeader){
        res.status(403).send("Authorization header was not provided");
        return;

    }
    
    const token = authorizationHeader.split(" ")[1];
    if(!token){
        res.status(403).send("Bearer token not found"); 
        return;
    }
}

export default validateJWT;