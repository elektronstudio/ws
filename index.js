import { createServer } from "http";
import { App } from "@tinyhttp/app";
import WebSocket from "ws";
import redis from "redis";

// Set up message storage

const messages = [];
const messagesMaxLength = 100000;

// Set up HTTP server

const app = new App();

app.get("/messages", (req, res) => res.json(messages));

const server = createServer(async (req, res) => {
  await app.handler(req, res);
}).listen(8000);

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
      saveMessage(message);
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
      saveMessage(message);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });
}

// Utility functions

const saveMessage = (message) => {
  const parsedMessage = safeJsonParse(message);
  if (parsedMessage?.save) {
    if (messages.length >= messagesMaxLength) {
      messages.shift();
    }
    messages.push(parsedMessage);
  }
};

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
};
