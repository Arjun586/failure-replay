// server/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import incidentRoutes from './routes/incident.routes';
import uploadRoutes from './routes/upload.routes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- PRODUCTION MIDDLEWARES ---
app.use(helmet()); // Adds security headers
app.use(cors({ origin: 'http://localhost:5173' })); // Allows React to talk to us
app.use(express.json()); // Allows us to read JSON data from the frontend
app.use(morgan('dev')); // Logs requests in the terminal (e.g., "POST /api/incidents 201")

// --- ROUTES ---
// Health Check
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', message: 'Failure Replay API is running smoothly. 🚀' });
});


app.use('/api/incidents', incidentRoutes);

app.use('/api/upload', uploadRoutes);

// --- START THE SERVER ---
app.listen(PORT, () => {
    console.log(`\n===============================================`);
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`=================================================\n`);
});