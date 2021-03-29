import { createServer } from "http";
import Redis from "ioredis";
import { exit } from "process";
import WebSocket from "ws";
import got from "got";

import { App } from "@tinyhttp/app";
import { cors } from "@tinyhttp/cors";

if (!process.env.DATABASE_URL || !process.env.SECRET) {
  console.log(
    "Usage: \u001b[32mDATABASE_URL=redis://localhost:6379 SECRET=secret node .\u001b[0m"
  );
  exit();
}

const dbUrl = process.env.DATABASE_URL;
const secret = process.env.SECRET;
const pubsubChannel = "ws";
const messagesList = "messages";

const redis = new Redis(dbUrl);
const subscriber = new Redis(dbUrl);
const publisher = new Redis(dbUrl);

// Set up HTTP server

const app = new App();
app.use(cors({ origin: true }));

const hasSecret = (req) =>
  secret && req.query && req.query.secret && req.query.secret === secret;

app.get("/messages/clear", async (req, res) => {
  if (hasSecret(req)) {
    await redis.del(messagesList);
    res.json([]);
  } else {
    res.status(403).send("No access");
  }
});

app.get("/messages", async (req, res) => {
  if (hasSecret(req)) {
    const messages = await redis.lrange(messagesList, 0, -1);
    res.json(messages.map(safeJsonParse));
  } else {
    res.status(403).send("No access");
  }
});

const server = createServer(async (req, res) => {
  await app.handler(req, res);
}).listen(8080);

// Set up Websocket server

const wss = new WebSocket.Server({ server });

// Set up publisher

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    publisher.publish(pubsubChannel, message);
    const parsedMessage = safeJsonParse(message);
    if (parsedMessage?.store) {
      redis.rpush(messagesList, message);
    }
  });
});

// Set up subscriber

subscriber.subscribe(pubsubChannel);

subscriber.on("message", (channel, message) => {
  if (channel === pubsubChannel) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
});

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
};

const statsUrl = process.env.STATS_URL;
const statsApikey = process.env.STATS_APIKEY;

const createMessage = (message) => {
  const id = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .sort(() => Math.random() - 0.5)
    .slice(0, 16)
    .join("");
  return JSON.stringify({
    id,
    datetime: new Date().toISOString(),
    type: "",
    channel: "",
    userId: "",
    userName: "",
    value: "",
    ...message,
  });
};

const sendStats = () => {
  got
    .get(statsUrl, {
      headers: {
        "x-api-key": statsApikey,
      },
      responseType: "json",
    })
    .then((res) => {
      console.log(res.body);
      if (res.body?.length) {
        const message = createMessage({
          type: "STATS",
          value: res.body,
        });
        publisher.publish(pubsubChannel, message);
      }
    });
};

if (statsUrl && statsApikey) {
  sendStats();
  setInterval(sendStats, 30 * 1000);
}
