// server/src/routes/upload.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { parseLogFile } from '../services/parser.service';

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

router.post('/', upload.single('logfile'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        //We pass the saved file to our new parser!
        const newIncident = await parseLogFile(req.file.path, req.file.originalname);

        res.status(200).json({
            success: true,
            message: 'File parsed and incident created!',
            incident: newIncident,
        });
        
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: 'Server error during upload parsing' });
    }
});

export default router;