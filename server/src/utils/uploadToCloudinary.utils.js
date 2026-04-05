import cloudinary from '../config/cloudinary.config.js';



const uploadToCloudinary = (fileBuffer, folder = 'uploads') => {
   return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
         {
            folder,
            resource_type: 'auto',
         },
         (error, result) => {
            if (error) return reject(error);
            resolve(result);
         }
      );

      stream.end(fileBuffer);
   });
};

export default uploadToCloudinary;