let socket;
let peerConnection;
let dataChannel;
let controlMethod = "";
let peer;
// let targetSocketId = getUrlParameter("id");

const init = () => {
  targetSocketId = getUrlParameter("id");
  if (!targetSocketId) {
    alert("Missing target ID in querystring");
    return;
  }
  initSocket();
};

const initSocket = () => {
  socket = io.connect("/");

  socket.on("connect", () => {
    console.log(`Controller Connected: ${socket.id}`);
    setupWebRTC();
  });

  socket.on("signal", (signal, fromPeerId) => {
    // Only process the signal if it's meant for this controller
    if (fromPeerId === targetSocketId) {
      console.log("Received signal");
      if (!peer) setupWebRTC();
      peer.signal(signal);
    }
  });
};

const setupWebRTC = () => {
  peer = new SimplePeer({
    initiator: true,
    trickle: false,
  });

  peer.on("signal", (data) => {
    console.log("Sending signal to", targetSocketId);
    // Correctly include targetSocketId in the signal emission
    socket.emit("signal", targetSocketId, data);
  });

  peer.on("connect", () => {
    console.log("Peer connection established");
    // Now connected to the game, can send game control signals
  });

  peer.on("data", (data) => {
    console.log("Received data:", new TextDecoder().decode(data));
    // Process incoming data, such as game state updates
  });

  peer.on("close", () => console.log("Connection closed"));
  peer.on("error", (err) => console.error("Error:", err));
};

// Handling of incoming data
const handleIncomingData = (data) => {
  const parsedData = JSON.parse(data);
  console.log("Data received:", parsedData);
};

const setupControlMethodListeners = () => {
  document.getElementById("useGyroscope").addEventListener("click", () => {
    controlMethod = "gyroscope";
    document.querySelector(".gyroscope-controls").style.display = "block";
    document.querySelector(".button-controls").style.display = "none";
    setupGyroscopeControlListeners();
  });

  document.getElementById("useButtons").addEventListener("click", () => {
    controlMethod = "buttons";
    document.querySelector(".button-controls").style.display = "block";
    document.querySelector(".gyroscope-controls").style.display = "none";
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
    peer.send(JSON.stringify({ command: command }));
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
