import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const PORT = 3000;

// Store room data
const rooms = new Map();

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
    res.send("🚀 Express + Socket.IO server is running!");
});

// Create HTTP server & attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    // Optimize socket.io performance
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Handle socket connections
io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // User joins a room
    socket.on("joinRoom", (data) => {
        const { roomId, userInfo } = data;
        socket.join(roomId);

        // Store user info
        socket.userId = userInfo?.userId || socket.id;
        socket.userName = userInfo?.name || `User ${socket.id.slice(0, 6)}`;
        socket.userColor = userInfo?.color || "#000000";
        socket.currentRoom = roomId;

        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                users: new Map(),
                canvasState: []
            });
        }

        const room = rooms.get(roomId);
        room.users.set(socket.id, {
            id: socket.userId,
            name: socket.userName,
            color: socket.userColor,
            socketId: socket.id
        });

        console.log(`✅ ${socket.userName} (${socket.id}) joined room ${roomId}`);

        // Send current canvas state to new user (only to this user)
        if (room.canvasState.length > 0) {
            socket.emit("canvasState", room.canvasState);
        }

        // Notify others in room about new user
        socket.to(roomId).emit("userJoined", {
            userId: socket.userId,
            name: socket.userName,
            color: socket.userColor
        });

        // Send room info to user
        socket.emit("roomInfo", {
            roomId,
            users: Array.from(room.users.values())
        });
    });

    // Optimized drawing events with batching
    let drawingBuffer = [];
    let broadcastTimeout = null;

    socket.on("drawing", (data) => {
        if (!socket.currentRoom) return;

        const room = rooms.get(socket.currentRoom);
        if (!room) return;

        // Add drawing to room's canvas state
        const drawingData = {
            ...data,
            userId: socket.userId,
            userName: socket.userName,
            timestamp: Date.now()
        };

        // Update canvas state efficiently
        if (data.tool === 'pen' || data.tool === 'laser') {
            // For pen/laser, update existing stroke or add new one
            const existingIndex = room.canvasState.findIndex(item => item.id === data.id);
            if (existingIndex >= 0) {
                room.canvasState[existingIndex] = drawingData;
            } else {
                room.canvasState.push(drawingData);
            }
        } else {
            // For other tools, just add to state
            room.canvasState.push(drawingData);
        }

        // Immediate broadcast for better real-time performance
        socket.to(socket.currentRoom).emit("drawing", drawingData);
    });

    // Optimized cursor movement with throttling
    let lastCursorBroadcast = 0;
    socket.on("cursorMove", (data) => {
        if (!socket.currentRoom) return;

        const now = Date.now();
        // Throttle to max 20 updates per second
        if (now - lastCursorBroadcast < 50) return;
        lastCursorBroadcast = now;

        const cursorData = {
            ...data,
            userId: socket.userId,
            name: socket.userName,
            color: socket.userColor,
            timestamp: now
        };

        socket.to(socket.currentRoom).emit("cursorMove", cursorData);
    });

    // Optimized pen drawing with batching
    socket.on("penStroke", (data) => {
        if (!socket.currentRoom) return;

        // Immediate broadcast for pen strokes
        socket.to(socket.currentRoom).emit("penStroke", {
            ...data,
            userId: socket.userId,
            timestamp: Date.now()
        });
    });

    // Handle clear canvas
    socket.on("clearCanvas", (data) => {
        if (!socket.currentRoom) return;

        const room = rooms.get(socket.currentRoom);
        if (room) {
            room.canvasState = [];
        }

        socket.to(socket.currentRoom).emit("clearCanvas");
    });

    // Handle canvas state updates
    socket.on("updateCanvasState", (canvasState) => {
        if (!socket.currentRoom) return;

        const room = rooms.get(socket.currentRoom);
        if (room) {
            room.canvasState = canvasState;
            socket.to(socket.currentRoom).emit("canvasState", canvasState);
        }
    });

    // Handle user leaving room
    socket.on("leaveRoom", () => {
        if (socket.currentRoom) {
            const room = rooms.get(socket.currentRoom);
            if (room) {
                room.users.delete(socket.id);

                // Clean up empty rooms
                if (room.users.size === 0) {
                    rooms.delete(socket.currentRoom);
                }
            }

            socket.to(socket.currentRoom).emit("userLeft", {
                userId: socket.userId,
                name: socket.userName
            });

            socket.leave(socket.currentRoom);
            socket.currentRoom = null;
        }
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);

        if (socket.currentRoom) {
            const room = rooms.get(socket.currentRoom);
            if (room) {
                room.users.delete(socket.id);

                // Clean up empty rooms
                if (room.users.size === 0) {
                    rooms.delete(socket.currentRoom);
                }
            }

            socket.to(socket.currentRoom).emit("userLeft", {
                userId: socket.userId,
                name: socket.userName
            });
        }

        io.emit("removeCursor", socket.id);
    });
});

// Start server with HTTP
server.listen(PORT, () => {
    console.log(`🚀 Express + Socket.IO server is running on http://localhost:${PORT}`);
});
