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

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to collaboration server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from collaboration server');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
    }
  }

  joinRoom(boardId, userId, userName) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }
    
    this.currentRoom = boardId;
    this.socket.emit('join_room', { boardId, userId, userName });
    console.log(`📱 Joining room: ${boardId} as ${userName}`);
    return true;
  }

  leaveRoom() {
    if (!this.socket || !this.currentRoom) return false;
    
    this.socket.emit('leave_room');
    this.currentRoom = null;
    return true;
  }

  // Drawing events
  emitDrawingStart(data) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('drawing_start', data);
      console.log('🎨 Drawing start emitted:', data);
    }
  }

  emitDrawingUpdate(data) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('drawing_update', data);
    }
  }

  emitDrawingEnd(data) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('drawing_end', data);
      console.log('🎨 Drawing end emitted:', data);
    }
  }

  emitShapesUpdate(shapes) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('shapes_update', { shapes });
      console.log('📊 Shapes update emitted, count:', shapes.length);
    }
  }

  emitCursorMove(x, y) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('cursor_move', { x, y });
    }
  }

  emitCanvasClear() {
    if (this.socket && this.currentRoom) {
      this.socket.emit('canvas_clear');
      console.log('🧹 Canvas clear emitted');
    }
  }

  // Event listeners
  onBoardState(callback) {
    if (this.socket) {
      this.socket.on('board_state', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user_joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user_left', callback);
    }
  }

  onShapesUpdate(callback) {
    if (this.socket) {
      this.socket.on('shapes_update', callback);
    }
  }

  onCursorUpdate(callback) {
    if (this.socket) {
      this.socket.on('cursor_update', callback);
    }
  }

  onCanvasClear(callback) {
    if (this.socket) {
      this.socket.on('canvas_clear', callback);
    }
  }

  onDrawingStart(callback) {
    if (this.socket) {
      this.socket.on('drawing_start', callback);
    }
  }

  onDrawingUpdate(callback) {
    if (this.socket) {
      this.socket.on('drawing_update', callback);
    }
  }

  onDrawingEnd(callback) {
    if (this.socket) {
      this.socket.on('drawing_end', callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export default new SocketService();
