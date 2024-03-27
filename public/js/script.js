const $url = document.getElementById("url");
const $canvas = document.getElementById("gameCanvas");
const $game = document.querySelector(".game");
const $score = document.querySelector(".score");
const $connectionInfo = document.querySelector(".connection-information");
const $instructions = document.querySelector(".greeting-and-instructions");
const $startmessage = document.querySelector(".start-message");
const ctx = $canvas.getContext("2d");

let socket;
let targetSocketId;

let gameHasStarted = false;
let dx = 10;
let dy = 0;
let changingDirection = false;
let foodX;
let foodY;
let score = 0;
let gameLoop;
let peer;

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const init = () => {
  // targetSocketId = getUrlParameter("id");
  // if (!targetSocketId) {
  //   alert(`Missing target ID in querystring`);
  //   return;
  // }
  initSocket();
  // createPeer(true, targetSocketId);
  $game.style.display = "none";
  $connectionInfo.style.display = "flex";
};

const initSocket = () => {
  socket = io.connect("/");
  socket.on("connect", () => {
    console.log(`Connected: ${socket.id}`);
    const url = `${new URL(
      `/controller.html?id=${socket.id}`,
      window.location
    )}`;
    $url.textContent = url;
    $url.setAttribute("href", url);
    const typeNumber = 4;
    const errorCorrectionLevel = "L";
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(url);
    qr.make();
    document.getElementById("qr").innerHTML = qr.createImgTag(4);
  });

  socket.on("signal", (signal, fromPeerId) => {
    console.log("Received signal from", fromPeerId, signal);
    if (!peer) {
      createPeer();
    }
    // Directly pass the signal data to peer.signal without parsing as JSON
    peer.signal(signal);
  });

  socket.on("controller-disconnect", () => {
    console.log("Controller has disconnected.");
    // Add any UI updates or game reset logic here
    alert("Controller has disconnected. Please refresh to start a new game.");
    $game.style.display = "none";
    $connectionInfo.style.display = "flex";
    $instructions.style.display = "block";
    // Optionally, reset the game to its initial state
    resetGame(); // Ensure you have a function defined to reset the game
  });
};

const createPeer = () => {
  peer = new SimplePeer({ initiator: false });

  peer.on("signal", (data) => {
    console.log("Emitting signal");
    // The signal is now emitted without a specific target since this is the receiver part
    socket.emit("signal", data);
  });

  peer.on("connect", () => {
    console.log("Peer connection established");
    // Now ready to receive controller commands
  });

  peer.on("data", (data) => {
    handleGameCommand(JSON.parse(new TextDecoder().decode(data)));
    // Process incoming control commands
  });

  peer.on("close", () => console.log("Connection closed"));
  peer.on("error", (err) => console.error("Error:", err));
};

const handleIncomingData = (data) => {
  const message = data.toString();
  console.log("Received data:", message);

  if (message === "start game") {
    startGame();
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

init();
