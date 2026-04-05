import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
   if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')){
      cb(null, true);
   }
   else {
      cb(new Error('Only images and videos are allowed'), false);
   }
};

const upload = multer({
   storage,
   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
   fileFilter,
});

export default upload;