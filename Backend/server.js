import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import boardsRoutes from "./src/routes/boards.route.js";
import { initializeWhiteboardSocket } from "./src/sockets/whiteboard.socket.js";

const app = express();
const server = createServer(app);

// **IMPORTANT**: Fix the CORS configuration
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"], // Your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  allowEIO3: true, // Allow Engine.IO v3 clients
  transports: ['websocket', 'polling']
});

const PORT = 3000;

// Express CORS middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  allowedHeaders: ["*"]
}));

app.use(express.json());
app.use("/api/boards", boardsRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Collaborative Whiteboard Server is running!");
});

// Initialize Socket.IO
initializeWhiteboardSocket(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});
