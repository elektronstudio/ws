import { createServer } from "http";
import { App } from "@tinyhttp/app";
import WebSocket from "ws";

const app = new App();

const messages = [];

app.get("/messages", (req, res) => res.json(messages));

const server = createServer(async (req, res) => {
  await app.handler(req, res);
}).listen(8000);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    messages.push(JSON.parse(message));
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});
