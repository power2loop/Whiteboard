import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.isConnected = false;
  }

  connect(serverUrl = 'http://localhost:3000') {
    if (this.socket) {
      this.disconnect();
    }

    console.log('🔄 Attempting to connect to:', serverUrl);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
      withCredentials: true,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to collaboration server, ID:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from collaboration server, reason:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
      console.error('🔴 Error type:', error.type);
      console.error('🔴 Error description:', error.description);
      console.error('🔴 Error message:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔴 Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔴 Failed to reconnect to server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
    }
  }

  joinRoom(boardId, userId, userName) {
    if (!this.socket) {
      console.error('❌ Socket not initialized, cannot join room');
      return false;
    }
    
    if (!this.isConnected) {
      console.error('❌ Socket not connected, cannot join room');
      return false;
    }
    
    this.currentRoom = boardId;
    this.socket.emit('join_room', { boardId, userId, userName });
    console.log(`📱 Joining room: ${boardId} as ${userName}`);
    return true;
  }

  leaveRoom() {
    if (!this.socket || !this.currentRoom) {
      console.log('❌ Cannot leave room: socket not connected or no current room');
      return false;
    }
    
    console.log('👋 Leaving room:', this.currentRoom);
    this.socket.emit('leave_room');
    this.currentRoom = null;
    return true;
  }

  // Drawing events with logging
  emitDrawingStart(data) {
    if (this.socket && this.currentRoom && this.isConnected) {
      console.log('📤 Emitting drawing start:', data.tool);
      this.socket.emit('drawing_start', data);
    } else {
      console.warn('⚠️ Cannot emit drawing start: socket not ready');
    }
  }

  emitDrawingUpdate(data) {
    if (this.socket && this.currentRoom && this.isConnected) {
      this.socket.emit('drawing_update', data);
    }
  }

  emitDrawingEnd(data) {
    if (this.socket && this.currentRoom && this.isConnected) {
      console.log('📤 Emitting drawing end:', data.tool);
      this.socket.emit('drawing_end', data);
    } else {
      console.warn('⚠️ Cannot emit drawing end: socket not ready');
    }
  }

emitShapesUpdate(shapes) {
  if (this.socket && this.currentRoom && this.isConnected) {
    // Fix: Ensure shapes is always an array
    const shapesArray = Array.isArray(shapes) ? shapes : [];
    console.log('📤 Emitting shapes update, count:', shapesArray.length);
    this.socket.emit('shapes_update', { shapes: shapesArray });
  } else {
    console.warn('⚠️ Cannot emit shapes update: socket not ready');
  }
}

  emitCursorMove(x, y) {
    if (this.socket && this.currentRoom && this.isConnected) {
      this.socket.emit('cursor_move', { x, y });
    }
  }

  emitCanvasClear() {
    if (this.socket && this.currentRoom && this.isConnected) {
      console.log('📤 Emitting canvas clear');
      this.socket.emit('canvas_clear');
    } else {
      console.warn('⚠️ Cannot emit canvas clear: socket not ready');
    }
  }

  // Event listeners with validation
  onBoardState(callback) {
    if (this.socket) {
      this.socket.on('board_state', (data) => {
        console.log('📥 Received board state:', data);
        callback(data);
      });
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user_joined', (data) => {
        console.log('📥 User joined:', data.user?.name);
        callback(data);
      });
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user_left', (data) => {
        console.log('📥 User left:', data.user?.name);
        callback(data);
      });
    }
  }

  onShapesUpdate(callback) {
    if (this.socket) {
      this.socket.on('shapes_update', (data) => {
        console.log('📥 Received shapes update, count:', data.shapes?.length);
        callback(data);
      });
    }
  }

  onCursorUpdate(callback) {
    if (this.socket) {
      this.socket.on('cursor_update', callback);
    }
  }

  onCanvasClear(callback) {
    if (this.socket) {
      this.socket.on('canvas_clear', (data) => {
        console.log('📥 Canvas cleared by:', data.clearedBy);
        callback(data);
      });
    }
  }

  onDrawingStart(callback) {
    if (this.socket) {
      this.socket.on('drawing_start', (data) => {
        console.log('📥 Remote drawing started by:', data.userName);
        callback(data);
      });
    }
  }

  onDrawingUpdate(callback) {
    if (this.socket) {
      this.socket.on('drawing_update', callback);
    }
  }

  onDrawingEnd(callback) {
    if (this.socket) {
      this.socket.on('drawing_end', (data) => {
        console.log('📥 Remote drawing ended by:', data.userName);
        callback(data);
      });
    }
  }

  // Utility methods
  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  // Test connection method
  testConnection() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping', 'test');
      console.log('📡 Testing connection...');
      return true;
    }
    console.error('❌ Cannot test connection: socket not ready');
    return false;
  }
}

export default new SocketService();
