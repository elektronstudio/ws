import { createServer } from "http";
import { App } from "@tinyhttp/app";
import { cors } from "@tinyhttp/cors";
import WebSocket from "ws";
import redis from "redis";

// Set up message storage

const history = [];
const historyMaxLength = 100000;

// Set up HTTP server

const app = new App();
app.use(cors({ origin: true }));
app.get("/history/clear", (req, res) => {
  history = [];
  res.json(history);
});
app.get("/history", (req, res) => res.json(history));

const server = createServer(async (req, res) => {
  await app.handler(req, res);
}).listen(8080);

// Set up Websocket server

const wss = new WebSocket.Server({ server });

if (process.env.REDIS_URL) {
  console.log("Set up Redis-based multinode broadcaster");

  const redisChannel = "ws";
  const redisUrl = process.env.REDIS_URL;

  const subscriber = redis.createClient({
    url: redisUrl,
  });

  subscriber.subscribe(redisChannel);

  const publisher = subscriber.duplicate();

  // Set up publisher

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      publisher.publish(redisChannel, message);
    });
  });

  // Set up subscriber

  subscriber.on("message", (channel, message) => {
    if (channel === redisChannel) {
      messageHistory(message);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });
} else {
  console.log("Setting up single node websocket broadcaster");

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      messageHistory(message);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });
}

// Utility functions

const messageHistory = (message) => {
  const parsedMessage = safeJsonParse(message);
  if (parsedMessage?.history) {
    if (history.length >= historyMaxLength) {
      history.shift();
    }
    history.push(parsedMessage);
  }
};

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
};
