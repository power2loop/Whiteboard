// src/services/realtime/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // connect to backend

export default socket;
