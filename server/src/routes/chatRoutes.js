import express from 'express';
import { processChat } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', processChat);

export default router;
