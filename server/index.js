const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "*" },
});

// Middleware
app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("New Connection");
  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    console.log("User", emailId, "joined Room", roomId);
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);
    socket
      .to(socketId)
      .emit("incoming-call", { from: fromEmail, offer: offer });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });
});

app.get("/health", (req, res) => res.send("ok"));

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running at PORT ${PORT}`));
