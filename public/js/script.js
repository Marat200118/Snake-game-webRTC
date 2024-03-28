const $url = document.getElementById("url");
const $canvas = document.getElementById("gameCanvas");
const $gameCanvas = document.getElementById("gameCanvas");
const $game = document.querySelector(".game");
const $connectionInfo = document.querySelector(".connection-information");
const $instructions = document.querySelector(".greeting-and-instructions");
const $controlmethod = document.querySelector(".controlmethod");
const $startmessage = document.querySelector(".start-message");
const ctx = $canvas.getContext("2d");

let gameHasStarted = false;
let socket;
let dx = 10;
let dy = 0;
let changingDirection = false;
let foodX;
let foodY;
let score = 0;
let gameLoop;

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const init = () => {
  initSocket();
  $game.style.display = "none";
};

const initSocket = () => {
  socket = io.connect(`/`);
  socket.on(`connect`, () => {
    console.log(socket.id);
    linkandQr();
  });

  socket.on("signal", async (myId, signal, peerId) => {
    console.log(`Received signal from ${peerId}`);
    console.log(signal);
    if (signal.type === "offer") {
      answerPeerOffer(myId, signal, peerId);
    }
    peer.signal(signal);
  });

  socket.on("client-disconnect", (client) => {
    console.log(`Client disconnected: ${client.id}`);
    $instructions.style.display = "flex";
    $controlmethod.style.display = "none";
    $game.style.display = "none";
    $startmessage.style.display = "none";
    $connectionInfo.style.display = "flex";
  });
};

const answerPeerOffer = async (myId, offer, peerId) => {
  peer = new SimplePeer();
  peer.on("signal", (data) => {
    socket.emit("signal", peerId, data);
  });

  peer.on("connect", () => {
    console.log("Peer connected, now you can send messages.");
    $instructions.style.display = "none";
    $controlmethod.style.display = "block";
    $game.style.display = "flex";
    $startmessage.style.display = "block";
    $connectionInfo.style.display = "none";
  });

  peer.on("data", (data) => {
    console.log("Data from controller:", data.toString());
  });
};

const linkandQr = () => {
  const url = `${new URL(`/controller.html?id=${socket.id}`, window.location)}`;
  $url.textContent = url;
  $url.setAttribute("href", url);

  const typeNumber = 4;
  const errorCorrectionLevel = "L";
  const qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(url);
  qr.make();
  document.getElementById("qr").innerHTML = qr.createImgTag(4);
};

init();
