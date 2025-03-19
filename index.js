// Express application
import express from 'express';


// configuration
const
cfg = {
    port: process.env.PORT || 3100
};
let count = 1;
// Express initiation
const app = express();

// home page route
app.get('/', (req, res) => {
    console.log(req.url);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');


    count++;
    console.log(count);

    res.send(`${count}<h1>Hello World!</h1>`);

});

// serve static assets
app.use(express.static('static'));

// start server
app.listen(cfg.port, () => {
    console.log(`Example app listening at http://localhost:${ cfg.port }.`);
});