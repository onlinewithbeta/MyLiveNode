// Express application
import express from 'express';
import mongoose from "mongoose";
import {cfg} from './confg.js';


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

//connect to database
 async function connectDB() {   
   const Mongodb_url =cfg.DB_URL;
   
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
app.post('/', (req, res) => {
    console.log(req.body);
    let sss = req.body;
    sss.reply = "I am ok";
    res.send(sss);
});


//Increase tokens
async function increaseTokens(gmail, amount, notes) {
    try {
        let user = await PermiumUser.findOne({ gmail: gmail });
        if (!user) throw new Error(`User ${gmail} not found`);
        
        if ((user.tokens + amount) < 0) {
            throw new Error(`Insufficient tokens. Current balance: ${user.tokens}`);
        }
                amount = amount/1000;

        const trans = {
            action: notes,
            cost: amount,
            balance: user.tokens + amount,
            date: getDateOnly(),
            time: getTimeOnly()
        };

        // Initialize details if not exists
        if (!user.details) user.details = { Transactions: [] };
        if (!user.details.Transactions) user.details.Transactions = [];
        
        
        user.tokens += amount;
        user.details.Transactions.push(trans);
        user.markModified('details'); // Important for mixed types

        await user.save();
        return user;
    } catch (error) {
        console.error(`Error in deductTokens for ${gmail}:`, error);
        throw error;
    }
}


app.post('/Buying',async (req, res) => {
    
    console.log(req.body);
    
   try{
     let payMent = req.body;
     if(payMent.event === 'charge.success'){
       const gmail = payMent.data.customer.email;
       const amount = payMent.data.amount;
     
     let user =  await increaseTokens(gmail, amount, `Bought Tokens`);
   
    console.log(req.body);
    
    res.send(user);
     }else{
       console.log('Failure');
       console.log(req.body.data);
       
    res.send("Allgood");
       
     }
   }
   catch(err){
    console.log(`We noticed ${err.message}`);
    res.send(`We noticed ${err.message}`);
   }
   
});

// start server
app.listen(cfg.port, () => {
    console.log(`Our app is listening on http://localhost:${ cfg.port }`);
});