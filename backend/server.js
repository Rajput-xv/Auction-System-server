const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const router = express.Router();

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(
	cors({
		origin: ["https://auction-system-client.vercel.app", "http://localhost:5173"],
		methods: ["GET", "PUT", "POST", "DELETE"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"]
	})
);
app.use(router);
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/auctions", require("./routes/auctionRoutes"));
app.use("/api/bids", require("./routes/bidRoutes"));

app.get('/', (req, res) => res.send('Hello World!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
