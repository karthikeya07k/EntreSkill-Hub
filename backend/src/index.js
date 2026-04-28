const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { assertRequiredEnv, getCorsOptions, isOriginAllowed } = require("./config/env");
const { setIO } = require("./config/socket");
const MentorSession = require("./models/MentorSession");
const ChatMessage = require("./models/ChatMessage");
const User = require("./models/User");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  assertRequiredEnv();
  await connectDB();
  const { allowedOrigins } = getCorsOptions();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (isOriginAllowed(origin, allowedOrigins)) {
          return callback(null, true);
        }

        return callback(new Error("Socket CORS policy blocks this origin."));
      },
      credentials: true
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
    socket.emit("socket:ready", {
      userId: socket.user._id.toString(),
      connectedAt: new Date().toISOString()
    });

    socket.on("session:join", async (payload = {}, ack) => {
      try {
        const { sessionId } = payload;
        if (!sessionId) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "sessionId is required." });
          }
          return;
        }

        const session = await MentorSession.findById(sessionId).select("mentor mentee");
        if (!session) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Session not found." });
          }
          return;
        }

        const isParticipant =
          session.mentor.toString() === socket.user._id.toString() ||
          session.mentee.toString() === socket.user._id.toString();

        if (!isParticipant) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "You are not part of this session." });
          }
          return;
        }

        const roomId = `session:${session._id}`;
        socket.join(roomId);

        if (typeof ack === "function") {
          ack({ ok: true, roomId });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "Unable to join session." });
        }
      }
    });

    socket.on("chat:message", async (payload = {}, ack) => {
      try {
        const { sessionId, text } = payload;
        const normalizedText = typeof text === "string" ? text.trim() : "";

        if (!sessionId || !normalizedText) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "sessionId and text are required." });
          }
          return;
        }

        if (normalizedText.length > 1000) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Message must be 1000 characters or less." });
          }
          return;
        }

        const session = await MentorSession.findById(sessionId).select("mentor mentee");
        if (!session) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Session not found." });
          }
          return;
        }

        const isParticipant =
          session.mentor.toString() === socket.user._id.toString() ||
          session.mentee.toString() === socket.user._id.toString();

        if (!isParticipant) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "You are not part of this session." });
          }
          return;
        }

        const roomId = `session:${session._id}`;
        const messageDoc = await ChatMessage.create({
          roomId,
          sender: socket.user._id,
          text: normalizedText
        });

        const populated = await messageDoc.populate("sender", "name role");
        io.to(roomId).emit("chat:new", populated);

        if (typeof ack === "function") {
          ack({ ok: true, messageId: messageDoc._id.toString(), createdAt: messageDoc.createdAt });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "Failed to send message." });
        }
      }
    });

    socket.on("disconnect", () => {
      socket.removeAllListeners("session:join");
      socket.removeAllListeners("chat:message");
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
