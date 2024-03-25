const express = require("express");
const app = express();
const fs = require("fs");
const https = require("https");
const socketIO = require("socket.io");

const options = {
  key: fs.readFileSync("localhost.key"),
  cert: fs.readFileSync("localhost.crt"),
};

const server = https.createServer(options, app);
const port = process.env.PORT || 443;

// Serve static files from the "public" directory
app.use(express.static("public"));

const io = socketIO(server);

server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  socket.on("offer", (data) => {
    console.log(`Forwarding offer from ${socket.id} to ${data.to}`);
    io.to(data.to).emit("offer", { from: socket.id, offer: data.offer });
  });

  socket.on("answer", (data) => {
    console.log(`Forwarding answer from ${socket.id} to ${data.to}`);
    io.to(data.to).emit("answer", { from: socket.id, answer: data.answer });
  });

  socket.on("iceCandidate", (data) => {
    console.log(`Forwarding ICE candidate from ${socket.id} to ${data.to}`);
    io.to(data.to).emit("iceCandidate", {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
  });
});
