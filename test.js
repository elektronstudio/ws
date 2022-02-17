import fetch from "node-fetch";
import Websocket from "ws";

// Set up Websocket endpoint

const url = process.env.WS_URL ?? "http://localhost:8080";

// Establish Websocket connection

const ws = new Websocket(
  url.replace("https://", "wss://").replace("http://", "ws://")
);

ws.on("open", () => {
  // Output incoming message
  ws.on("message", (data) => {
    console.log(safeJsonParse(data));
  });
  // Send test messages
  ws.send(createMessage({ type: "CHAT", save: true }));
  ws.send(createMessage({ type: "USER" }));
  // Get history
  fetch(`${url}/messages?secret=${process.env.SECRET}`)
    .then((res) => res.text())
    .then((res) => console.log(res))
    .catch((e) => console.log(e));
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

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
};
