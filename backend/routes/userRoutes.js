const express = require("express");
const {
	registerUser,
	loginUser,
	getProfile,
	logoutUser,
} = require("../controllers/userController");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/profile", getProfile);
router.post("/logout", logoutUser);

module.exports = router;
