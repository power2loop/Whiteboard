import { v4 as uuidv4 } from 'uuid';

// In-memory storage (replace with database in production)
const boards = new Map();
const activeRooms = new Map();

class BoardsService {
  // Create a new board
  createBoard(hostUserId, hostUserName) {
    const boardId = uuidv4();
    const board = {
      id: boardId,
      hostUserId,
      hostUserName,
      createdAt: new Date(),
      shapes: [],
      collaborators: new Map(),
      isActive: true
    };
    
    boards.set(boardId, board);
    return board;
  }

  // Get board by ID
  getBoardById(boardId) {
    return boards.get(boardId);
  }

  // Update board shapes
  updateBoardShapes(boardId, shapes) {
    const board = boards.get(boardId);
    if (board) {
      board.shapes = shapes;
      board.lastModified = new Date();
      return true;
    }
    return false;
  }

  // Add collaborator to board
  addCollaborator(boardId, userId, userName, socketId) {
    const board = boards.get(boardId);
    if (board) {
      board.collaborators.set(userId, {
        id: userId,
        name: userName,
        socketId,
        joinedAt: new Date(),
        cursor: { x: 0, y: 0 }
      });
      return true;
    }
    return false;
  }

  // Remove collaborator from board
  removeCollaborator(boardId, userId) {
    const board = boards.get(boardId);
    if (board) {
      board.collaborators.delete(userId);
      return true;
    }
    return false;
  }

  // Update collaborator cursor
  updateCollaboratorCursor(boardId, userId, cursor) {
    const board = boards.get(boardId);
    if (board && board.collaborators.has(userId)) {
      board.collaborators.get(userId).cursor = cursor;
      return true;
    }
    return false;
  }

  // Get all collaborators for a board
  getBoardCollaborators(boardId) {
    const board = boards.get(boardId);
    return board ? Array.from(board.collaborators.values()) : [];
  }

  // Check if user is board host
  isBoardHost(boardId, userId) {
    const board = boards.get(boardId);
    return board && board.hostUserId === userId;
  }

  // Set room as active
  setRoomActive(roomId, socketId) {
    activeRooms.set(roomId, {
      id: roomId,
      socketId,
      lastActivity: new Date()
    });
  }

  // Remove active room
  removeActiveRoom(roomId) {
    activeRooms.delete(roomId);
  }

  // Get active room
  getActiveRoom(roomId) {
    return activeRooms.get(roomId);
  }
}

export default new BoardsService();
