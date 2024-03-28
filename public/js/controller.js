let socket;
let peer;
let targetSocketId = new URLSearchParams(window.location.search).get("id");

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const init = () => {
  initSocket();
};

const initSocket = () => {
  socket = io.connect("/");
  socket.on("connect", () => {
    console.log(socket.id);
    callPeer();
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

const callPeer = async () => {
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
    // Now safe to add the click event listener
    document.getElementById("btnPress").addEventListener("click", () => {
      console.log("Sending 'Button Pressed'");
      peer.send("Button Pressed");
    });
  });
};

init();
