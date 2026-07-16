import uploadToCloudinary from '../utils/uploadToCloudinary.utils.js';
import Media from '../models/media.model.js';
import mongoose from 'mongoose';
import Job from '../models/job.model.js';
import { getNormalizedRole, hasMode } from '../utils/user.utils.js';

const isSameEntity = (left, right) => String(left || '') === String(right || '');

const canAccessJobMedia = (user, job) => {
   const role = getNormalizedRole(user?.role);

   if (role === 'admin') {
      return true;
   }

   return (
      isSameEntity(job.customer, user?._id) ||
      isSameEntity(job.selectedWorker, user?._id)
   );
};

const getMediaQueryForViewer = (user, job, requestedStage = "") => {
   const role = getNormalizedRole(user?.role);

   if (
      role === 'admin' ||
      isSameEntity(job.customer, user?._id) ||
      isSameEntity(job.selectedWorker, user?._id)
   ) {
      return {
         jobId: job._id,
         ...(requestedStage ? { stage: requestedStage } : {}),
      };
   }

   if (job.status === 'broadcasting' && hasMode(user, 'worker')) {
      const allowedStages = requestedStage
         ? [requestedStage].filter((stage) =>
              ['customer_context', 'before_work'].includes(stage),
           )
         : ['customer_context', 'before_work'];

      return {
         jobId: job._id,
         stage: { $in: allowedStages },
      };
   }

   return null;
};

const canUploadStage = (user, job, stage) => {
   const role = getNormalizedRole(user?.role);

   if (role === 'admin') {
      return true;
   }

   if (['customer_context', 'before_work'].includes(stage)) {
      return isSameEntity(job.customer, user?._id);
   }

   if (stage === 'after_work') {
      return isSameEntity(job.selectedWorker, user?._id);
   }

   return false;
};

export const uploadMedia = async (req, res) => {
   try {
      const { jobId } = req.params;
      const stage = String(req.body?.stage || 'customer_context').trim();

      if (!mongoose.Types.ObjectId.isValid(jobId)) {
         return res.status(400).json({ success: false, message: 'Invalid jobId' });
      }

      const job = await Job.findById(jobId);
      if (!job) {
         return res.status(404).json({ success: false, message: 'Job not found' });
      }

      if (!['customer_context', 'before_work', 'after_work'].includes(stage)) {
         return res.status(400).json({
            success: false,
            message: 'stage must be customer_context, before_work, or after_work',
         });
      }

      if (!canAccessJobMedia(req.user, job) || !canUploadStage(req.user, job, stage)) {
         return res.status(403).json({
            success: false,
            message: 'You are not allowed to upload proof for this stage',
         });
      }

      if (!req.file) {
         return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const result = await uploadToCloudinary(
         req.file.buffer,
         `karigar/jobs/${jobId}/${stage}`,
      );

      const mediaType = result.resource_type === 'video' ? 'video' : 'image';
      const media = await Media.create({
         url: result.secure_url,
         public_id: result.public_id,
         type: mediaType,
         stage,
         originalName: req.file.originalname || '',
         mimeType: req.file.mimetype || '',
         size: Number(req.file.size || 0),
         jobId,
         uploadedBy: req.user?._id,
      });

      res.status(201).json({
         success: true,
         media,
      });

   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Upload failed',
         error: error.message,
      });
   }
};



export const getMediaByJob = async (req, res) => {
   try {
      const { jobId } = req.params;
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const stage = req.query.stage ? String(req.query.stage).trim() : "";

      if (!jobId) {
         return res.status(400).json({ success: false, message: 'jobId is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(jobId)) {
         return res.status(400).json({ success: false, message: 'Invalid jobId' });
      }

      const job = await Job.findById(jobId);
      if (!job) {
         return res.status(404).json({ success: false, message: 'Job not found' });
      }

      const query = getMediaQueryForViewer(req.user, job, stage);
      if (!query) {
         return res.status(403).json({
            success: false,
            message: 'You are not allowed to view proof for this job',
         });
      }
      const skip = (page - 1) * limit;

      const media = await Media.find(query)
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit)
         .populate('uploadedBy', 'Name role activeMode')
         .select('url public_id type stage originalName mimeType size uploadedBy createdAt');

      const total = await Media.countDocuments(query);

      res.status(200).json({
         success: true,
         page,
         total,
         count: media.length,
         data: media,
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch media',
         error: error.message,
      });
   }
};
