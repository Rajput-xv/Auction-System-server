const express = require("express");
const {
	createAuctionItem,
	getAuctionItems,
	updateAuctionItem,
	deleteAuctionItem,
	getAuctionItemById,
	getAuctionItemsByUser,
	getAuctionWinner,
	getAuctionsWonByUser,
} = require("../controllers/auctionController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/").get(getAuctionItems).post(authMiddleware, createAuctionItem);
router.post("/user", authMiddleware, getAuctionItemsByUser);
router.get("/winner/:id", authMiddleware, getAuctionWinner);
router.post("/won", authMiddleware, getAuctionsWonByUser);

router
	.route("/:id")
	.get(authMiddleware, getAuctionItemById)
	.put(authMiddleware, updateAuctionItem)
	.delete(authMiddleware, deleteAuctionItem);

module.exports = router;
