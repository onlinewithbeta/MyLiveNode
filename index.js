// Express application
import express from 'express';
let count = 1;


// configuration
const
  cfg = {
    port: process.env.PORT || 3000
  };

// Express initiation
const app = express();

// home page route
app.get('/', (req, res) => {
    count++;
  res.send('Hello World!');
});

// start server
app.listen(cfg.port, () => {
  console.log(`Example app listening at http://localhost:${ cfg.port } with ${count}`);
});

