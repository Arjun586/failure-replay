import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { authenticateUser } from '../middleware/auth.middleware'; 
import { uploadLogFile } from '../controllers/upload.controller';

const router = Router(); 

// Ensure the local 'uploads' directory exists when the server starts so Multer doesn't crash
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configures local disk storage for temporary retention of uploaded log files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    },
});

// Initializes the Multer middleware with a file size limit and the correct storage engine 
const upload = multer({
    storage: storage, // You must pass the 'storage' configuration here
    limits: { fileSize: 150 * 1024 * 1024 } // Increased to 150MB to handle large logs safely
});

// Map the POST route: Auth -> Multer Upload -> Controller 
router.post('/', authenticateUser, upload.single('logfile'), uploadLogFile);

export default router;