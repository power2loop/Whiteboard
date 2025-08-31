import boardsService from '../services/boards.service.js';

class BoardsController {
  // Create a new collaborative board
  createBoard = async (req, res) => {
    try {
      const { hostUserId, hostUserName } = req.body;

      if (!hostUserId || !hostUserName) {
        return res.status(400).json({
          success: false,
          message: 'Host user ID and name are required'
        });
      }

      const board = boardsService.createBoard(hostUserId, hostUserName);
      
      res.status(201).json({
        success: true,
        data: {
          boardId: board.id,
          shareUrl: `${req.protocol}://${req.get('host')}/collaborate/${board.id}`,
          hostUserId: board.hostUserId,
          hostUserName: board.hostUserName,
          createdAt: board.createdAt
        },
        message: 'Board created successfully'
      });
    } catch (error) {
      console.error('Create board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create board'
      });
    }
  };

  // Get board details
  getBoardDetails = async (req, res) => {
    try {
      const { boardId } = req.params;
      const board = boardsService.getBoardById(boardId);

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      const collaborators = boardsService.getBoardCollaborators(boardId);

      res.json({
        success: true,
        data: {
          id: board.id,
          hostUserId: board.hostUserId,
          hostUserName: board.hostUserName,
          shapes: board.shapes,
          collaborators: collaborators.map(c => ({
            id: c.id,
            name: c.name,
            joinedAt: c.joinedAt
          })),
          createdAt: board.createdAt,
          lastModified: board.lastModified
        }
      });
    } catch (error) {
      console.error('Get board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get board details'
      });
    }
  };

  // Join board as collaborator
  joinBoard = async (req, res) => {
    try {
      const { boardId } = req.params;
      const { userId, userName } = req.body;

      if (!userId || !userName) {
        return res.status(400).json({
          success: false,
          message: 'User ID and name are required'
        });
      }

      const board = boardsService.getBoardById(boardId);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      res.json({
        success: true,
        data: {
          boardId: board.id,
          hostUserName: board.hostUserName,
          shapes: board.shapes,
          collaborators: boardsService.getBoardCollaborators(boardId)
        },
        message: 'Ready to join board'
      });
    } catch (error) {
      console.error('Join board error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join board'
      });
    }
  };
}

export default new BoardsController();
