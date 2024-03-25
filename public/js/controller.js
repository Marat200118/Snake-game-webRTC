let socket;
let targetSocketId;
let controlMethod = "";
let gyroscope = new Gyroscope({ frequency: 5 });

const init = () => {
  targetSocketId = getUrlParameter("id");
  if (!targetSocketId) {
    alert("Missing target ID in querystring");
    return;
  }
  socket = io.connect("/");
  socket.on("connect", () => {
    console.log(`Connected: ${socket.id}`);
    socket.emit("controllerConnected", true);
    setupControlMethodListeners();

    document.getElementById("useGyroscope").addEventListener("click", () => {
      socket.emit("controlMethodSelected", {
        method: "gyroscope",
        controllerId: socket.id,
      });
    });

    document.getElementById("useButtons").addEventListener("click", () => {
      socket.emit("controlMethodSelected", {
        method: "buttons",
        controllerId: socket.id,
      });
    });
  });

  socket.on("scoreUpdate", (data) => {
    document.querySelector(
      ".scoreDisplay"
    ).textContent = `Score: ${data.score}`;
  });

  document.querySelector(".start").addEventListener("click", startGame);
  document.querySelector(".reset").addEventListener("click", resetGame);
};

const setupControlMethodListeners = () => {
  const gyroscopeButton = document.getElementById("useGyroscope");
  const buttonsButton = document.getElementById("useButtons");

  gyroscopeButton.addEventListener("click", () => {
    controlMethod = "gyroscope";
    highlightSelection(gyroscopeButton, buttonsButton);
    setupGyroscopeControlListeners();
    socket.emit("controlMethod", { method: "gyroscope" });
  });

  buttonsButton.addEventListener("click", () => {
    controlMethod = "buttons";
    highlightSelection(buttonsButton, gyroscopeButton);
    setupButtonControlListeners();
    socket.emit("controlMethod", { method: "buttons" });
  });
};

const startGame = () => {
  if (controlMethod === "") {
    alert("Please select a control method first.");
    return;
  }
  document.querySelector(".control-method-choice").style.display = "none";
  document.querySelector(".start").style.display = "none";
  document.querySelector(".game-controls").style.display = "flex";
  document.querySelector(
    controlMethod === "gyroscope" ? ".gyroscope-controls" : ".button-controls"
  ).style.display = "flex";
  sendCommand("start");
};

const resetGame = () => {
  sendCommand("reset");
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
  document
    .querySelector(".up")
    .addEventListener("click", () => sendCommand("up"));
  document
    .querySelector(".left")
    .addEventListener("click", () => sendCommand("left"));
  document
    .querySelector(".right")
    .addEventListener("click", () => sendCommand("right"));
  document
    .querySelector(".down")
    .addEventListener("click", () => sendCommand("down"));
};

const highlightSelection = (selectedButton, otherButton) => {
  selectedButton.classList.add("selected");
  otherButton.classList.remove("selected");
};

const sendCommand = (command) => {
  if (socket.connected) {
    socket.emit("update", targetSocketId, { command });
  }
};

const getUrlParameter = (name) => {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  const results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
};

init();
