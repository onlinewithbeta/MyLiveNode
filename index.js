// Express application
import express from "express";
import mongoose from "mongoose";
import { cfg } from "./confg.js";

const UserSchema = new mongoose.Schema({
    gmail: { type: String, unique: true },
    phone: Number,
    password: String,
    mate: String,
    faculty: String,
    department: String,
    tokens: { type: Number, default: 0 },
    OTP: Number,
    details: {
        type: Object,
        default: {
            Transactions: Array
        }
    }
});
const PermiumUser = mongoose.model("PermiumUser", UserSchema);

const tokenBuySchema = new mongoose.Schema({
    gmail: String,
    dept: String,

    cost: Number,
    bal: Number,

    ref: String
});
const tokenBought = mongoose.model("tokenBought", tokenBuySchema);

//connect to database
async function connectDB() {
    const Mongodb_url = cfg.DB_URL;

    //DB_URL
    await mongoose.connect(Mongodb_url).then(() => console.log("connected"));
}

await connectDB();

function getDateOnly(locale = "en-US", options = {}) {
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        ...options
    }).format(new Date());
}
// Example output: "November 15, 2023"

function getTimeOnly(locale = "en-US", options = {}) {
    return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        ...options
    }).format(new Date());
}
// Example output: "02:30:45 PM"

// Express initiation
const app = express();
app.use(express.json());

// home page route
app.post("/", (req, res) => {
    console.log(req.body);
    let sss = req.body;
    sss.reply = "I am ok";
    res.send(sss);
});

//Increase tokens
async function increaseTokens(gmail, amount, notes, ref) {
    try {
        let user = await PermiumUser.findOne({ gmail: gmail });
        if (!user) throw new Error(`User ${gmail} not found`);

        if (user.tokens + amount < 0) {
            throw new Error(
                `Insufficient tokens. Current balance: ${user.tokens}`
            );
        }
        // Initialize details if not exists
        if (!user.details) user.details = { Transactions: [] };
        if (!user.details.Transactions) user.details.Transactions = [];

        //The user Transactions
        let userTransactions = user.details.Transactions;
        let thisTrans = null; //This Transactions

        //Go through Transactions
        for (let i = 0; i < userTransactions.length; i++) {
            //Find the particular Transactions to Increase
            if (userTransactions[i].transId === ref) {
                if (userTransactions[i].status === "pending") {
                    thisTrans = userTransactions[i];
                    user.details.Transactions[i] = {
                        transId: ref,
                        status: "successful",
                        action: notes,
                        cost: amount * 10,
                        balance: user.tokens + amount,
                        date: getDateOnly(),
                        time: getTimeOnly()
                    };
                }
                break;
            }
        }
        //Increase Tokens and save
        user.tokens += amount;
        user.markModified("details"); // Important for mixed types
        await user.save();

        //Save Funding in action not very neccessary
        try {
            await saveFunding(
                user.gmail,
                user.department,
                amount*10,
                user.tokens,
                ref
            );
        } catch (err) {
            console.log(`Failed to save ${err.message}`);
        }
        return user;
    } catch (error) {
        console.error(`Error in deductTokens for ${gmail}:`, error);
        throw error;
    }
}
//save Funding in action
async function saveFunding(gmail, department, cost, tokens, ref) {
    let fundAction = new tokenBought({
        gmail: gmail,
        dept: department,
        cost: cost,
        bal: tokens,
        ref: ref
    });
    await fundAction.save();
    
}

app.post("/Buying", async (req, res) => {
    try {
        console.log(req.body);
        //custom details
        let payDetails = req.body.data.metadata.ppq;
        let payMent = req.body;
        console.log("Startibg");
        if (payMent.event === "charge.success") {
            //if a Transactions is successful
            if (!payDetails) res.send("ok");
            //if a Transactions is from ppq

            const gmail = payDetails.gmail;
            let ref = payMent.data.reference;
            const tokens = Number(payDetails.tokens);

            console.log(gmail, ref, tokens);

            let user = await increaseTokens(
                gmail,
                tokens,
                `Bought Tokens`,
                ref
            );

            res.send([user.gmail, user.tokens]);

        } else {
         //was not a successful Transactions
            console.log(req.body.data);

            res.send("Allgood");
        }
    } catch (err) {
        console.log(`We noticed ${err.message}`);
        res.send(`We noticed ${err.message}`);
    }
});
// start server
app.listen(cfg.port, () => {
    console.log(`Our app is listening on http://localhost:${cfg.port}`);
});
