// Express application
import express from 'express';
import {cfg} from './confg.js';





// Express initiation
const app = express();
app.use(express.json());

// home page route
app.post('/', (req, res) => {
    console.log(req.body);
    res.send(req.body);
});

// start server
app.listen(cfg.port, () => {
    console.log(`Our app is listening on http://localhost:${ cfg.port }`);
});