// server/src/routes/upload.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { parseLogFile } from "../services/parser.service"
import { authenticateUser } from '../middleware/auth.middleware';
import { logQueue } from '../workers/log.worker';

// Initializes the Express router for log file ingestion
const router = Router();

// Configures local disk storage for temporary retention of uploaded log files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Initializes the Multer middleware with a 50MB file size limit for uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Processes single-file log uploads and triggers the asynchronous normalization pipeline
router.post('/', authenticateUser, upload.single('logfile'), async (req, res) => {
    try {
        // Validates that a file was successfully received in the request
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        // Ensures a project context is provided to scope the ingested logs
        const { projectId } = req.body;
        if (!projectId) {
            res.status(400).json({ success: false, message: 'projectId is required' });
            return;
        }

        
        // User waits 0.1 seconds, parsing happens in background
        await logQueue.add('process-logs', {
        filePath: req.file.path,
        originalName: req.file.originalname,
        projectId: projectId
        });

        res.status(202).json({ 
        success: true, 
        message: "Logs are being processed in the background!" 
        });
    } catch (error) {
        // Log errors and notify the client if the parsing pipeline fails
        console.error("Upload Route Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during upload" });
    }
});

// Exports the log upload router
export default router;