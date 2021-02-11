import Websocket from "ws";
import fetch from "node-fetch";

// Set up Websocket endpoint

const url = process.argv[2] ?? "http://localhost:8080";

// Establish Websocket connection

const ws = new Websocket(
  url.replace("https://", "wss://").replace("http://", "ws://")
);

ws.on("open", () => {
  // Output incoming message
  ws.on("message", (data) => {
    console.log(JSON.parse(data));
  });
  // Send test messages
  ws.send(createMessage({ type: "CHAT", save: true }));
  ws.send(createMessage({ type: "USER" }));
  // Get history
  fetch(`${url}/history`)
    .then((res) => res.json())
    .then((res) => console.log(res));
});

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
