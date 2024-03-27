const $url = document.getElementById("url");
const $canvas = document.getElementById("gameCanvas");
const $game = document.querySelector(".game");
const $score = document.querySelector(".score");
const $connectionInfo = document.querySelector(".connection-information");
const $instructions = document.querySelector(".greeting-and-instructions");
const ctx = $canvas.getContext("2d");
const socket = io("/");

let gameHasStarted = false;
let dx = 10;
let dy = 0;
let changingDirection = false;
let foodX;
let foodY;
let score = 0;
let gameLoop;
let peer;

let peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
let dataChannel;

const init = () => {
  setupWebRTC();
  setupSignalingListeners();

  socket.on("connect", () => {
    console.log(`Connected: ${socket.id}`);
    const url = `${window.location.origin}/controller.html?id=${socket.id}`;
    $url.textContent = url;
    $url.setAttribute("href", url);
    displayQRCode(url);
    $game.style.display = "none";
    $connectionInfo.style.display = "flex";
  });
};

const setupWebRTC = () => {
  // No need to create a peer connection or data channel manually, SimplePeer handles this
  socket.on("signal", (data) => {
    if (!peer) {
      peer = new SimplePeer({
        initiator: false,
        trickle: false,
      });

      peer.on("signal", (data) => {
        socket.emit("signal", { to: data.from, signal: data.signal });
      });

      peer.on("data", handleIncomingData);
    }

    peer.signal(data.signal);
  });
};

const setupSignalingListeners = () => {
  socket.on("connect", () => {
    console.log(`Game Connected: ${socket.id}`);
  });

  socket.on("offer", (data) => {
    console.log(`Received offer from ${data.from}`);
    if (!peer) {
      peer = new SimplePeer({
        initiator: false,
        trickle: false,
      });

      peer.on("signal", (answer) => {
        socket.emit("answer", { answer, to: data.from });
      });

      peer.on("data", handleIncomingData);
    }
    peer.signal(data.offer);
    $game.style.display = "flex";
    document.querySelector(".start-message").style.display = "block";
    document.querySelector(".start-message").innerText =
      "Choose your control method and press 'start' on your controller to start the game";
    $connectionInfo.style.display = "none";
    $instructions.style.display = "none";
    $score.style.display = "block";
  });

  socket.on("answer", (data) => {
    const { answer } = data;
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on("iceCandidate", (data) => {
    if (data.candidate) {
      peer.signal(data.candidate);
    }
  });

  socket.on("iceCandidate", async (message) => {
    if (message.candidate) {
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(message.candidate)
      );
    }
  });
};

const handleIncomingData = (data) => {
  const parsedData = JSON.parse(data);
  console.log("Received data:", parsedData);
  if (parsedData.command === "start") {
    startGame();
  } else if (parsedData.command === "reset") {
    resetGame();
  } else {
    changeDirection(parsedData.command);
  }
};

let snake = [
  { x: 150, y: 150 },
  { x: 140, y: 150 },
  { x: 130, y: 150 },
  { x: 120, y: 150 },
  { x: 110, y: 150 },
];

const main = () => {
  if (hasGameEnded()) return;

  changingDirection = false;
  clearTimeout(gameLoop);
  gameLoop = setTimeout(function onTick() {
    clearCanvas();
    drawFood();
    drawSnake();
    moveSnake();

    if (snake[0].x === foodX && snake[0].y === foodY) {
      score += 10;
      document.querySelector(".score").innerHTML = `Score: ${score}`;
      socket.emit("scoreUpdate", { score: score });
      const newHead = { x: snake[0].x + dx, y: snake[0].y + dy };
      snake.unshift(newHead);
      createFood();
    }

    main();
  }, 150);
};

const clearCanvas = () => {
  ctx.fillStyle = "black";
  ctx.strokestyle = "white";
  ctx.fillRect(0, 0, $canvas.width, $canvas.height);
  ctx.strokeRect(0, 0, $canvas.width, $canvas.height);
};

const drawSnake = () => {
  snake.forEach((part) => {
    ctx.fillStyle = "lightgreen";
    ctx.strokestyle = "darkgreen";
    ctx.fillRect(part.x, part.y, 10, 10);
    ctx.strokeRect(part.x, part.y, 10, 10);
  });
};

const moveSnake = () => {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);
  snake.pop();
};

const changeDirection = (command) => {
  if (changingDirection) return;
  changingDirection = true;

  if (command === "up" && dy === 0) {
    dx = 0;
    dy = -10;
  } else if (command === "down" && dy === 0) {
    dx = 0;
    dy = 10;
  } else if (command === "left" && dx === 0) {
    dx = -10;
    dy = 0;
  } else if (command === "right" && dx === 0) {
    dx = 10;
    dy = 0;
  }
};

const hasGameEnded = () => {
  for (let i = 4; i < snake.length; i++) {
    const collided = snake[i].x === snake[0].x && snake[i].y === snake[0].y;
    if (collided) return true;
  }
  const hitLeftWall = snake[0].x < 0;
  const hitRightWall = snake[0].x > $canvas.width - 10;
  const hitToptWall = snake[0].y < 0;
  const hitBottomWall = snake[0].y > $canvas.height - 10;

  if (hitLeftWall || hitRightWall || hitToptWall || hitBottomWall) {
    socket.emit("scoreUpdate", { score });
    console.log("Game over");
    return true;
  }

  return hitLeftWall || hitRightWall || hitToptWall || hitBottomWall;
};

const createFood = () => {
  foodX = Math.round((Math.random() * ($canvas.width - 10)) / 10) * 10;
  foodY = Math.round((Math.random() * ($canvas.height - 10)) / 10) * 10;
  snake.forEach(function isFoodOnSnake(part) {
    const foodIsOnSnake = part.x == foodX && part.y == foodY;
    if (foodIsOnSnake) createFood();
  });
};

const drawFood = () => {
  ctx.fillStyle = "red";
  ctx.strokestyle = "darkred";
  ctx.fillRect(foodX, foodY, 10, 10);
  ctx.strokeRect(foodX, foodY, 10, 10);
};

const startGame = () => {
  if (!gameHasStarted) {
    gameHasStarted = true;
    score = 0;
    document.querySelector(".score").innerHTML = "Score: 0";
    createFood();
    main();
  }
};

const resetGame = () => {
  console.log("Resetting game");
  clearTimeout(gameLoop);
  snake = [
    { x: 150, y: 150 },
    { x: 140, y: 150 },
    { x: 130, y: 150 },
    { x: 120, y: 150 },
    { x: 110, y: 150 },
  ];
  dx = 10;
  dy = 0;
  score = 0;
  gameHasStarted = true;
  document.querySelector(".score").innerHTML = "Score: 0";
  clearCanvas();
  createFood();
  drawSnake();
  main();
};

const displayQRCode = (url) => {
  const typeNumber = 4;
  const errorCorrectionLevel = "L";
  const qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(url);
  qr.make();
  document.getElementById("qr").innerHTML = qr.createImgTag(4, 16);
};

init();
