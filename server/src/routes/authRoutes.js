import express from 'express';
import { login, loginMicrosoft, forgotPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/microsoft', loginMicrosoft);
router.post('/forgot-password', forgotPassword);

export default router;
