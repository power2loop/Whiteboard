import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import boardsRoutes from "./src/routes/boards.route.js";
import { initializeWhiteboardSocket } from "./src/sockets/whiteboard.socket.js";

const app = express();
const server = createServer(app);

const Frontend_url = "http://localhost:5173";
const PORT = 3000;

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [{Frontend_url}], // Add your frontend URLs
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [{Frontend_url}],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/boards", boardsRoutes);

// Basic route
app.get("/", (req, res) => {
  res.send("🚀 Collaborative Whiteboard Server is running!");
});

// Initialize Socket.IO for whiteboard
initializeWhiteboardSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});
