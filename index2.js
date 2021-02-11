import { createServer } from "http";
import { App } from "@tinyhttp/app";
import WebSocket from "ws";
import redis from "redis";

// Set up message storage

const messages = [];
const messagesMaxLength = 100000;

// Set up Redis

const redisChannel = process.env.REDIS_CHANNEL || "ws";
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const subscriber = redis.createClient({
  url: redisUrl,
});

subscriber.subscribe(redisChannel);

const publisher = subscriber.duplicate();

// Set up HTTP server

const app = new App();

app.get("/messages", (req, res) => res.json(messages));

const server = createServer(async (req, res) => {
  await app.handler(req, res);
}).listen(8000);

// Set up Websocket serevr

const wss = new WebSocket.Server({ server });

// Set up publisher

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    publisher.publish(redisChannel, message);
  });
});

// Set up subscriber

subscriber.on("message", (channel, message) => {
  if (channel === redisChannel) {
    // If the message is JSON and contains save: true
    // we store the message in local array
    const parsedMessage = safeJsonParse(message);
    if (parsedMessage?.save) {
      if (messages.length >= messagesMaxLength) {
        messages.shift();
      }
      messages.push(parsedMessage);
    }
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
});

// Utility functions

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
};
