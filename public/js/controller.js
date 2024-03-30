const $startButton = document.querySelector(".start");
const $resetButton = document.querySelector(".reset");
const $useGyroscopeButton = document.getElementById("useGyroscope");
const $useButtonsButton = document.getElementById("useButtons");
const $upButton = document.querySelector(".up");
const $downButton = document.querySelector(".down");
const $leftButton = document.querySelector(".left");
const $rightButton = document.querySelector(".right");
const $scoreDisplay = document.querySelector(".scoreDisplay");

let socket;
let peer;
let targetSocketId = new URLSearchParams(window.location.search).get("id");
let gyroscope = new Gyroscope({ frequency: 5 });
let controlMethod = "";

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const init = () => {
  initSocket();

  $useGyroscopeButton.addEventListener("click", () => {
    controlMethod = "gyroscope";
    $useGyroscopeButton.classList.add("selected");
    $useButtonsButton.classList.remove("selected");
    // setupGyroscopeControlListeners();
    peer.send(controlMethod);
  });

  $useButtonsButton.addEventListener("click", () => {
    controlMethod = "buttons";
    $useButtonsButton.classList.add("selected");
    $useGyroscopeButton.classList.remove("selected");
    // setupButtonControlListeners();
    peer.send(controlMethod);
  });

  $resetButton.addEventListener("click", () => {
    resetGame();
  });
};

const initSocket = () => {
  socket = io.connect("/");
  socket.on("connect", () => {
    console.log(socket.id);
    createPeer();
  });

  socket.on("signal", async (myId, signal, peerId) => {
    console.log(`Received signal from ${peerId}`);
    console.log(signal);
    peer.signal(signal);
  });

  socket.on("client-disconnect", (client) => {
    console.log(`Client disconnected: ${client.id}`);
  });
};

const createPeer = async () => {
  peer = new SimplePeer({
    initiator: true,
    trickle: false,
    config: servers,
  });

  peer.on("signal", (data) => {
    socket.emit("signal", targetSocketId, data);
  });

  peer.on("connect", () => {
    console.log("Peer connected, now you can send messages.");
    $startButton.addEventListener("click", () => {
      console.log("Starting game");
      startGame();
    });
  });
  peer.on("data", (data) => {
    $scoreDisplay.textContent = `Score: ${data}`;
  });
};

const setupGyroscopeControlListeners = () => {
  if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", (event) => {
      const { alpha, beta, gamma } = event;
      const $ball = document.querySelector(".ball");

      let topPosition = 40 + beta * 0.7;
      let leftPosition = 40 + gamma * 0.7;

      topPosition = Math.max(0, Math.min(200, topPosition));
      leftPosition = Math.max(0, Math.min(200, leftPosition));

      $ball.style.top = `${topPosition}%`;
      $ball.style.left = `${leftPosition}%`;

      if (beta > 20) {
        sendCommand("down");
      } else if (beta < -20) {
        sendCommand("up");
      }

      if (gamma > 30) {
        sendCommand("right");
      } else if (gamma < -30) {
        sendCommand("left");
      }
    });
  } else {
    console.log("DeviceOrientationEvent is not supported by this device.");
  }
};

const setupButtonControlListeners = () => {
  $upButton.addEventListener("click", () => sendCommand("up"));
  $leftButton.addEventListener("click", () => sendCommand("left"));
  $rightButton.addEventListener("click", () => sendCommand("right"));
  $downButton.addEventListener("click", () => sendCommand("down"));
};

const sendCommand = (command) => {
  peer.send(command);
};

const startGame = () => {
  if (controlMethod === "") {
    alert("Please select a control method first.");
    return;
  }
  controlMethod === "gyroscope"
    ? setupGyroscopeControlListeners()
    : setupButtonControlListeners();

  document.querySelector(".control-method-choice").style.display = "none";
  document.querySelector(".start").style.display = "none";
  document.querySelector(".game-controls").style.display = "flex";
  document.querySelector(
    controlMethod === "gyroscope" ? ".gyroscope-controls" : ".button-controls"
  ).style.display = "flex";
  sendCommand("start");
};

const resetGame = () => {
  $scoreDisplay.textContent = `Score: 0`;
  sendCommand("reset");
};

init();
