import { MediaService } from "./media.service.js";

const mediaService = new MediaService();

export const uploadMedia = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { stage } = req.body;
        const media = await mediaService.uploadMedia(req.user, jobId, req.file, stage);

        return res.status(201).json({
            success: true,
            media,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Upload failed",
        });
    }
};

export const getMediaByJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { page, limit, stage } = req.query;
        const result = await mediaService.getMediaByJob(req.user, jobId, page, limit, stage);

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to fetch media",
        });
    }
};
