let socket;
let targetSocketId;
let peerConnection;
let dataChannel;
let controlMethod = "";

const init = () => {
  targetSocketId = getUrlParameter("id");
  if (!targetSocketId) {
    alert("Missing target ID in querystring");
    return;
  }
  socket = io.connect("/");

  socket.on("connect", () => {
    console.log(`Connected: ${socket.id}`);
    setupWebRTC();
  });

  document.querySelector(".start").addEventListener("click", () => {
    peer.send(JSON.stringify({ command: "start" }));
  });
  document.querySelector(".reset").addEventListener("click", () => {
    peer.send(JSON.stringify({ command: "reset" }));
  });
  setupControlMethodListeners();
};

const setupWebRTC = () => {
  peer = new SimplePeer({
    initiator: true,
    trickle: false,
  });

  peer.on("signal", (data) => {
    socket.emit("offer", { offer: data, to: targetSocketId });
  });

  socket.on("answer", (data) => {
    peer.signal(data.answer);
  });

  socket.on("iceCandidate", (data) => {
    if (data.candidate) {
      peer.signal(data.candidate);
    }
  });

  peer.on("connect", () => {
    console.log("Peer connection established");
    // Connection established, now you can start sending data
  });

  peer.on("data", (data) => {
    console.log("Received data:", data.toString());
  });
};

const setupControlMethodListeners = () => {
  document.getElementById("useGyroscope").addEventListener("click", () => {
    controlMethod = "gyroscope";
    setupGyroscopeControlListeners();
  });

  document.getElementById("useButtons").addEventListener("click", () => {
    controlMethod = "buttons";
    setupButtonControlListeners();
  });
};

const setupGyroscopeControlListeners = () => {
  if ("Gyroscope" in window) {
    const gyroscope = new Gyroscope({ frequency: 60 });
    gyroscope.addEventListener("reading", (e) => {
      if (gyroscope.x > 0.2) {
        sendCommand("right");
      } else if (gyroscope.x < -0.2) {
        sendCommand("left");
      }

      if (gyroscope.y > 0.2) {
        sendCommand("down");
      } else if (gyroscope.y < -0.2) {
        sendCommand("up");
      }
    });
    gyroscope.start();
  } else {
    console.log("Gyroscope not supported by the browser");
  }
};

const setupButtonControlListeners = () => {
  // Setup buttons listeners for manual control
  document
    .querySelector(".up")
    .addEventListener("click", () => sendCommand("up"));
  document
    .querySelector(".down")
    .addEventListener("click", () => sendCommand("down"));
  document
    .querySelector(".left")
    .addEventListener("click", () => sendCommand("left"));
  document
    .querySelector(".right")
    .addEventListener("click", () => sendCommand("right"));
};

const sendCommand = (command) => {
  if (peer && peer.connected) {
    const commandData = JSON.stringify({ command });
    peer.send(commandData);
  }
};

const handleIncomingData = (event) => {
  const data = JSON.parse(event.data);
  console.log("Data received:", data);
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
