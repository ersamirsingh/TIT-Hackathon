import express from 'express';
import upload from '../../middleware/upload.middleware.js';
import { getMediaByJob, uploadMedia } from './media.controller.js';
import authenticateUser from '../../middleware/authenticate.middleware.js';

const uploadRouter = express.Router();

uploadRouter.post('/upload/:jobId', authenticateUser, upload.single('file'), uploadMedia);
uploadRouter.get('/list/:jobId', authenticateUser, getMediaByJob);

export default uploadRouter;
