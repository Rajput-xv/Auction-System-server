const express = require("express");
const { placeBid, getBidHistory, getBidsByUser } = require("../controllers/bidController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, placeBid);
router.get("/:auctionItemId", authMiddleware, getBidHistory);
router.get("/user", authMiddleware, getBidsByUser);


module.exports = router;
