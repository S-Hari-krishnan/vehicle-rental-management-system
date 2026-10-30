const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = function(req,res,next){
    const authHeader = req.headers.authorization;

    if(!authHeader) return res.status(401).json({message:"no token provided"});

    const token = authHeader.split(" ")[1];

    try{
        const decodedToken = jwt.verify(token,SECRET_KEY);
        req.user = decodedToken;
        next();
    } catch(err){
        return res.status(403).json({message:"invalid or expired token"});
    }
}
