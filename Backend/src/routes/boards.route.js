import express from 'express';
import boardsController from '../controllers/boards.controller.js';

const router = express.Router();

// Create a new collaborative board
router.post('/create', boardsController.createBoard);

// Get board details
router.get('/:boardId', boardsController.getBoardDetails);

// Join board as collaborator
router.post('/:boardId/join', boardsController.joinBoard);

export default router;
