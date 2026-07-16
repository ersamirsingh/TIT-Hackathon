import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
   {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      type: { type: String, enum: ['image', 'video'], required: true },
      stage: {
         type: String,
         enum: ['customer_context', 'before_work', 'after_work'],
         default: 'customer_context',
         required: true,
      },
      originalName: {
         type: String,
         default: '',
         trim: true,
      },
      mimeType: {
         type: String,
         default: '',
         trim: true,
      },
      size: {
         type: Number,
         default: 0,
      },
      uploadedBy: {
         required: true,
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
      },
      jobId:{
         required:true,
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Job',
      }
   },
   { timestamps: true }
);

mediaSchema.index({ jobId: 1, stage: 1, createdAt: -1 });

const Media = mongoose.model('Media', mediaSchema);
export default Media
