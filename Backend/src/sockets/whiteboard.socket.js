import boardsService from '../services/boards.service.js';

const EVENTS = {
  // Connection events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  
  // Drawing events
  DRAWING_START: 'drawing_start',
  DRAWING_UPDATE: 'drawing_update',
  DRAWING_END: 'drawing_end',
  
  // Shape events
  SHAPES_UPDATE: 'shapes_update',
  
  // Cursor events
  CURSOR_MOVE: 'cursor_move',
  CURSOR_UPDATE: 'cursor_update',
  
  // Canvas events
  CANVAS_CLEAR: 'canvas_clear',
  
  // Error events
  ERROR: 'error'
};

export function initializeWhiteboardSocket(io) {
  console.log('🚀 Initializing whiteboard socket handlers');
  
  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);
    
    let currentRoom = null;
    let currentUser = null;

    // Join a collaborative room
    socket.on(EVENTS.JOIN_ROOM, async (data) => {
      try {
        const { boardId, userId, userName } = data;
        console.log(`👤 User ${userName} trying to join room ${boardId}`);
        
        // Validate input
        if (!boardId || !userId || !userName) {
          socket.emit(EVENTS.ERROR, { message: 'Invalid room join data' });
          return;
        }

        // Check if board exists
        const board = boardsService.getBoardById(boardId);
        if (!board) {
          socket.emit(EVENTS.ERROR, { message: 'Board not found' });
          return;
        }

        // Leave previous room if any
        if (currentRoom) {
          socket.leave(currentRoom);
          boardsService.removeCollaborator(currentRoom, currentUser?.id);
        }

        // Join new room
        socket.join(boardId);
        currentRoom = boardId;
        currentUser = { id: userId, name: userName };

        // Add collaborator to board
        boardsService.addCollaborator(boardId, userId, userName, socket.id);

        // Send current board state to joining user
        socket.emit('board_state', {
          shapes: board.shapes || [],
          collaborators: boardsService.getBoardCollaborators(boardId)
        });

        // Notify other users about new collaborator
        socket.to(boardId).emit(EVENTS.USER_JOINED, {
          user: { id: userId, name: userName },
          collaborators: boardsService.getBoardCollaborators(boardId)
        });

        console.log(`✅ User ${userName} joined room ${boardId}`);

      } catch (error) {
        console.error('❌ Join room error:', error);
        socket.emit(EVENTS.ERROR, { message: 'Failed to join room' });
      }
    });

    // Handle drawing start
    socket.on(EVENTS.DRAWING_START, (data) => {
      if (!currentRoom || !currentUser) return;
      
      console.log(`🎨 Drawing started by ${currentUser.name}:`, data.tool);
      socket.to(currentRoom).emit(EVENTS.DRAWING_START, {
        userId: currentUser.id,
        userName: currentUser.name,
        ...data
      });
    });

    // Handle drawing updates
    socket.on(EVENTS.DRAWING_UPDATE, (data) => {
      if (!currentRoom || !currentUser) return;
      
      socket.to(currentRoom).emit(EVENTS.DRAWING_UPDATE, {
        userId: currentUser.id,
        userName: currentUser.name,
        ...data
      });
    });

    // Handle drawing end
    socket.on(EVENTS.DRAWING_END, (data) => {
      if (!currentRoom || !currentUser) return;
      
      console.log(`🎨 Drawing ended by ${currentUser.name}:`, data.tool);
      socket.to(currentRoom).emit(EVENTS.DRAWING_END, {
        userId: currentUser.id,
        userName: currentUser.name,
        ...data
      });
    });

    // Handle shapes update (FIXED)
    socket.on(EVENTS.SHAPES_UPDATE, (data) => {
      if (!currentRoom || !currentUser) return;
      
      // Fix: Check if data and shapes exist before accessing length
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid data received for shapes update:', data);
        return;
      }

      const { shapes } = data;
      
      if (!shapes || !Array.isArray(shapes)) {
        console.error('❌ Invalid shapes data received. Expected array, got:', typeof shapes);
        return;
      }
      
      console.log(`📊 Shapes updated by ${currentUser.name}, count:`, shapes.length);
      
      // Update board state
      boardsService.updateBoardShapes(currentRoom, shapes);
      
      // Broadcast to all other users in room
      socket.to(currentRoom).emit(EVENTS.SHAPES_UPDATE, {
        shapes,
        updatedBy: currentUser.name
      });
    });

    // Handle cursor movement
    socket.on(EVENTS.CURSOR_MOVE, (data) => {
      if (!currentRoom || !currentUser) return;
      
      const { x, y } = data;
      
      // Update cursor position in service
      boardsService.updateCollaboratorCursor(currentRoom, currentUser.id, { x, y });
      
      // Broadcast cursor position to other users
      socket.to(currentRoom).emit(EVENTS.CURSOR_UPDATE, {
        userId: currentUser.id,
        userName: currentUser.name,
        cursor: { x, y }
      });
    });

    // Handle canvas clear
    socket.on(EVENTS.CANVAS_CLEAR, () => {
      if (!currentRoom || !currentUser) return;
      
      console.log(`🧹 Canvas cleared by ${currentUser.name}`);
      
      // Update board state
      boardsService.updateBoardShapes(currentRoom, []);
      
      // Broadcast to all users in room
      socket.to(currentRoom).emit(EVENTS.CANVAS_CLEAR, {
        clearedBy: currentUser.name
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      
      if (currentRoom && currentUser) {
        // Remove collaborator
        boardsService.removeCollaborator(currentRoom, currentUser.id);
        
        // Notify other users
        socket.to(currentRoom).emit(EVENTS.USER_LEFT, {
          user: currentUser,
          collaborators: boardsService.getBoardCollaborators(currentRoom)
        });
      }
    });

    // Handle manual leave room
    socket.on(EVENTS.LEAVE_ROOM, () => {
      if (currentRoom && currentUser) {
        console.log(`👋 User ${currentUser.name} leaving room ${currentRoom}`);
        
        socket.leave(currentRoom);
        boardsService.removeCollaborator(currentRoom, currentUser.id);
        
        socket.to(currentRoom).emit(EVENTS.USER_LEFT, {
          user: currentUser,
          collaborators: boardsService.getBoardCollaborators(currentRoom)
        });
        
        currentRoom = null;
        currentUser = null;
      }
    });
  });
}

export { EVENTS };
