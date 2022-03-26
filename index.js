console.clear();
var express = require('express');
const expressip = require('express-ip');
var app = express();
var bodyParser = require('body-parser');
require('dotenv').config()
app.use(bodyParser.json());
const port = 3001; // Needs to be 3001 because of Nginx

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

const m3u8 = require("twitch-m3u8");
const TwitchApi = require("node-twitch").default;
// use dotenv to get secret
const twitch = new TwitchApi({
  client_id: process.env.ID,
  client_secret: process.env.SECRET
});

var cors = require('cors')
app.use(cors())
app.use(expressip().getIpInfoMiddleware);

// Receive data from client
app.post('/api/test', async function (req, res) {
  const username = req.body.username;
  var ip = req.ipInfo
  console.log(`${ip.ip} requested ${username}`);
  if (username) {
    const streams = await twitch.getStreams({ channel: username });
    if (streams.data.length > 0) {
      const streamURL = await m3u8.getStream(username)
      res.send({ twitch: streams.data[0], m3u8: streamURL[0] });
    } else {
      res.status(404).send({ error: 'User is not live' })
    }
  } else {
    res.status(400).send({ error: 'No username specified' })
  }
});

// Start server
app.listen(port, function () {
  console.log(`Server listening on port ${port} | ${new Date()}`);
});