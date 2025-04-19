const Bid = require("../models/Bid");
const AuctionItem = require("../models/AuctionItem");
const jwt = require("jsonwebtoken");

const placeBid = async (req, res) => {
	const { auctionItemId, bidAmount } = req.body;
	const userId = req.user.id;

	if (!auctionItemId || !bidAmount || bidAmount <= 0) {
		return res.status(400).json({ message: "Invalid bid details" });
	}

	try {
		const auctionItem = await AuctionItem.findById(auctionItemId);

		if (!auctionItem) {
			return res.status(404).json({ message: "Auction item not found" });
		}

		if (bidAmount < auctionItem.startingBid) {
			return res.status(400).json({
				message:
					"Bid amount must be greater than or equal to the starting bid",
			});
		}

		let bid = await Bid.findOne({ auctionItemId, userId });

		if (bid) {
			if (bid.bidAmount < bidAmount) {
				bid.bidAmount = bidAmount;
				await bid.save();
				return res.status(200).json(bid);
			} else {
				return res.status(400).json({
					message: "New bid must be higher than the current bid",
				});
			}
		}

		const newBid = await Bid.create({
			auctionItemId,
			userId,
			bidAmount,
		});

		res.status(201).json(newBid);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getBidHistory = async (req, res) => {
	const { auctionItemId } = req.params;

	if (!auctionItemId) {
		return res.status(400).json({ message: "Auction item ID is required" });
	}

	try {
		const bids = await Bid.find({ auctionItemId }).populate(
			"userId",
			"username"
		);
		res.status(200).json(bids);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update getBidsByUser
const getBidsByUser = async (req, res) => {
    try {
        const bids = await Bid.find({ userId: req.user.id });
        const enhancedBids = await Promise.all(
            bids.map(async (bid) => {
                try {
                    const auctionItem = await AuctionItem.findById(bid.auctionItemId);
                    if (!auctionItem) {
                        return {
                            ...bid.toObject(),
                            auctionItem: null
                        };
                    }
                    return {
                        ...bid.toObject(),
                        auctionItem: {
                            _id: auctionItem._id,
                            title: auctionItem.title,
                            description: auctionItem.description,
                            endDate: auctionItem.endDate
                        }
                    };
                } catch (error) {
                    console.error(`Error processing bid ${bid._id}:`, error);
                    return {
                        ...bid.toObject(),
                        auctionItem: null
                    };
                }
            })
        );
        res.status(200).json({ bids: enhancedBids });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching bids" });
    }
};

module.exports = {
	placeBid,
	getBidHistory,
	getBidsByUser,
};
