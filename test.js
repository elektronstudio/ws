import Websocket from "ws";

// Set up Websocket endpoint

const url = "ws://localhost:8000";

// Establish Websocket connection

const ws = new Websocket(url);

ws.on("open", () => {
  // Output incoming message
  ws.on("message", (data) => {
    console.log(JSON.parse(data));
  });
  // Send test messages
  ws.send(createMessage({ type: "CHAT", save: true }));
  ws.send(createMessage({ type: "USER" }));
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
