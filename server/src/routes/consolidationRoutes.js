import express from 'express';
import { getConsolidation, triggerConsolidation } from '../controllers/consolidationController.js';

const router = express.Router();

router.get('/', getConsolidation);
router.post('/trigger', triggerConsolidation);

export default router;
