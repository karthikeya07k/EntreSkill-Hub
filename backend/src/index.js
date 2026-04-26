const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { setIO } = require("./config/socket");
const MentorSession = require("./models/MentorSession");
const ChatMessage = require("./models/ChatMessage");
const User = require("./models/User");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173"
    }
  });

  setIO(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token missing."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name role");

      if (!user) {
        return next(new Error("Invalid user."));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Socket authentication failed."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id}`);

    socket.on("session:join", async ({ sessionId }) => {
      const session = await MentorSession.findById(sessionId);
      if (!session) return;

      const isParticipant =
        session.mentor.toString() === socket.user._id.toString() ||
        session.mentee.toString() === socket.user._id.toString();

      if (!isParticipant) return;

      socket.join(`session:${session._id}`);
    });

    socket.on("chat:message", async ({ sessionId, text }) => {
      if (!text || !sessionId) return;

      const session = await MentorSession.findById(sessionId);
      if (!session) return;

      const isParticipant =
        session.mentor.toString() === socket.user._id.toString() ||
        session.mentee.toString() === socket.user._id.toString();

      if (!isParticipant) return;

      const roomId = `session:${session._id}`;
      const messageDoc = await ChatMessage.create({
        roomId,
        sender: socket.user._id,
        text: text.trim()
      });

      const populated = await messageDoc.populate("sender", "name role");
      io.to(roomId).emit("chat:new", populated);
    });
  });

  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
