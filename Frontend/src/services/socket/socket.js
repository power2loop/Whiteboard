// src/services/realtime/socket.js
import { io } from "socket.io-client";

const socket = io("https://whiteboard-1kfc.onrender.com/"); // connect to backend


export default socket;
