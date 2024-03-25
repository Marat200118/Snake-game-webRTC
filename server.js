const express = require("express");
const app = express();
const fs = require("fs");

const options = {
  key: fs.readFileSync("localhost.key"),
  cert: fs.readFileSync("localhost.crt"),
};

const server = require("https").Server(options, app);
const port = process.env.PORT || 443;
app.use(express.static("public"));

server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});

const io = require("socket.io")(server);

const clients = {};

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  clients[socket.id] = { id: socket.id, controllerConnected: false };

  socket.on("update", (targetSocketId, data) => {
    if (!clients[targetSocketId]) {
      console.log("Target socket not found:", targetSocketId);
      return;
    }
    console.log(`Command received: ${data.command}`);
    io.to(targetSocketId).emit("update", data);
  });

  socket.on("controllerConnected", () => {
    console.log("Controller connected for socket:", socket.id);
    clients[socket.id].controllerConnected = true;
    io.emit("controllerConnected", true);
  });

  socket.on("scoreUpdate", (data) => {
    console.log("Score Update", data);
    io.emit("scoreUpdate", data);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
    io.emit("controllerDisconnected");
    delete clients[socket.id];
  });

  socket.on("controllerConnected", (data) => {
    io.emit("controllerConnected", data);
  });

  socket.on("controlMethodSelected", (data) => {
    io.emit("controlMethodSelected", data);
  });

  socket.on("startGame", (data) => {
    io.emit("startGame", data);
  });

  socket.on("resetGame", (data) => {
    io.emit("resetGame", data);
  });
});
