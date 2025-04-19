const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        let token;
        if (req.cookies?.jwt) {
        token = req.cookies.jwt;
        }
        else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized - No token found",
            });
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Check if user still exists
        const currentUser = await User.findById(decoded.id).select("-password");
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: "User belonging to this token no longer exists",
            });
        }

        // 4. Check if user changed password after token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                success: false,
                message: "Password recently changed! Please log in again",
            });
        }

        // 5. Grant access
        req.user = currentUser;
        next();
    } catch (error) {
        // Handle specific JWT errors
        let message = "Not authorized - Invalid token";
        if (error.name === "TokenExpiredError") {
            message = "Session expired - Please log in again";
        } else if (error.name === "JsonWebTokenError") {
            message = "Invalid token - Please log in again";
        }

        res.status(401).json({
            success: false,
            message,
        });
    }
};

module.exports = authMiddleware;