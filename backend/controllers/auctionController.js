const AuctionItem = require("../models/AuctionItem");
const Bid = require("../models/Bid");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const createAuctionItem = async (req, res) => {
    const { title, description, startingBid, endDate } = req.body;
    const userId = req.user.id;

    // Validation checks
    if (!title || !description || !startingBid || !endDate) {
        return res.status(400).json({ 
            message: "All fields are required" 
        });
    }

    if (typeof startingBid !== "number" || startingBid <= 0) {
        return res.status(400).json({ 
            message: "Starting bid must be a positive number" 
        });
    }

    try {
        const endDateTime = new Date(endDate);
        if (isNaN(endDateTime)) {
            return res.status(400).json({ 
                message: "Invalid end date format" 
            });
        }

        const auctionItem = await AuctionItem.create({
            title,
            description,
            startingBid,
            endDate: endDateTime,
            createdBy: userId,
        });

        res.status(201).json(auctionItem);
    } catch (error) {
        console.error("Creation error:", error);
        res.status(500).json({ 
            message: error.message || "Server error during auction creation" 
        });
    }
};

const getAuctionItems = async (req, res) => {
	try {
		const auctionItems = await AuctionItem.find();
		res.status(200).json(auctionItems);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getAuctionItemById = async (req, res) => {
	const { id } = req.params;
	try {
		const auctionItem = await AuctionItem.findById(id);
		if (!auctionItem) {
			return res.status(404).json({ message: "Auction item not found" });
		}
		res.status(200).json(auctionItem);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getAuctionItemsByUser = async (req, res) => {
	try {
	  const auctionItems = await AuctionItem.find({ createdBy: req.user.id });
	  res.status(200).json({ auctionItems });
	} catch (error) {
	  console.log(error.message);
	  res.status(500).json({ message: error.message });
	}
  };

const updateAuctionItem = async (req, res) => {
	const { id } = req.params;
	const { title, description, startingBid, endDate } = req.body;
	const userId = req.user.id;

	try {
		const auctionItem = await AuctionItem.findById(id);

		if (!auctionItem) {
			return res.status(404).json({ message: "Auction item not found" });
		}

		if (auctionItem.createdBy.toString() !== userId) {
			return res.status(403).json({ message: "Unauthorized action" });
		}

		auctionItem.title = title || auctionItem.title;
		auctionItem.description = description || auctionItem.description;
		auctionItem.startingBid = startingBid || auctionItem.startingBid;
		auctionItem.endDate = endDate
			? new Date(new Date(endDate).getTime())
			: auctionItem.endDate;
		auctionItem.updatedAt = new Date(new Date().getTime());
		await auctionItem.save();

		res.json(auctionItem);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteAuctionItem = async (req, res) => {
	const { id } = req.params;
	const userId = req.user.id;

	try {
		const auctionItem = await AuctionItem.findById(id);

		if (!auctionItem) {
			return res.status(404).json({ message: "Auction item not found" });
		}

		if (auctionItem.createdBy.toString() !== userId) {
			return res.status(403).json({ message: "Unauthorized action" });
		}

		const bids = await Bid.find({ auctionItemId: id });
		for (const bid of bids) {
			await bid.remove();
		}

		await auctionItem.remove();

		res.json({ message: "Auction item removed" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getAuctionWinner = async (req, res) => {
	const { id } = req.params;
	try {
		const auctionItem = await AuctionItem.findById(id);
		if (!auctionItem) {
			return res
				.status(404)
				.json({ winner: "", message: "Auction item not found" });
		}

		if (new Date(auctionItem.endDate) > new Date(Date.now())) {
			return res
				.status(400)
				.json({ winner: "", message: "Auction has not ended yet" });
		}

		const bids = await Bid.find({ auctionItemId: id });
		if (bids.length === 0) {
			return res
				.status(200)
				.json({ winner: "", message: "No bids found" });
		}

		let highestBid = bids.reduce(
			(max, bid) => (bid.bidAmount > max.bidAmount ? bid : max),
			bids[0]
		);

		const winner = await User.findById(highestBid.userId);
		if (!winner) {
			return res
				.status(404)
				.json({ winner: "", message: "Winner not found" });
		}

		res.status(200).json({ winner });
	} catch (error) {
		console.error("Error fetching auction winner:", error);
		res.status(500).json({ message: error.message });
	}
};

// Update getAuctionsWonByUser
const getAuctionsWonByUser = async (req, res) => {
    try {
        const bidsByUser = await Bid.find({ userId: req.user.id });
        const auctionIds = [...new Set(bidsByUser.map(bid => bid.auctionItemId))];

        const wonAuctions = [];
        for (const auctionId of auctionIds) {
            const auction = await AuctionItem.findById(auctionId);
            if (new Date(auction.endDate) > new Date()) continue;

            const bids = await Bid.find({ auctionItemId: auctionId });
            const highestBid = bids.reduce((max, bid) => 
                bid.bidAmount > max.bidAmount ? bid : max, bids[0]
            );

            if (highestBid.userId.toString() === req.user.id) {
                wonAuctions.push({
                    auctionId,
                    title: auction.title,
                    description: auction.description,
                    winningBid: highestBid.bidAmount,
                    endDate: auction.endDate
                });
            }
        }
        res.status(200).json({ wonAuctions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching won auctions" });
    }
};

module.exports = {
	createAuctionItem,
	getAuctionItems,
	updateAuctionItem,
	deleteAuctionItem,
	getAuctionItemById,
	getAuctionItemsByUser,
	getAuctionWinner,
	getAuctionsWonByUser,
};
