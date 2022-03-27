console.clear();
var express = require('express');
const expressip = require('express-ip');
var app = express();

var bodyParser = require('body-parser');
require('dotenv').config()
app.use(bodyParser.json());
const port = 7073;

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  // Allow 3 requests every minute as to not exceed twitch limit
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 3 requests per `window` (here, per 1 minutes)
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

// Allow anyone to send request
var cors = require('cors')
app.use(cors())
// Log IP of request
app.use(expressip().getIpInfoMiddleware);

// Receive data from client
app.post('/api/request/twitch/user', async function (req, res) {
  const username = req.body.username;
  console.log(req.body)
  var ip = req.ipInfo
  console.log(`${ip.ip} requested ${username}`);
  if (username) {
    const streams = await twitch.getStreams({ channel: username });
    if (streams.data.length > 0) {
      const streamURL = await m3u8.getStream(username.toLowerCase())
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
