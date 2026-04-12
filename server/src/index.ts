// server/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import incidentRoutes from './routes/incident.routes';
import uploadRoutes from './routes/upload.routes';
import authRoutes from './routes/auth.routes';
import invitationRoutes from './routes/invitation.routes';
import projectRoutes from './routes/project.routes';
import cookieParser from 'cookie-parser';
import traceRoutes from './routes/trace.routes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- PRODUCTION MIDDLEWARES ---
app.use(helmet()); // Adds security headers
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
})); // Allows React to talk to us

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser()); // Allows us to read JSON data from the frontend
app.use(morgan('dev')); // Logs requests in the terminal (e.g., "POST /api/incidents 201")

// --- ROUTES ---
// Health Check
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', message: 'ReplayOS API is running smoothly. 🚀' });
});


app.use('/api/incidents', incidentRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/invites', invitationRoutes);
app.use('/api/projects', projectRoutes);
app.use("/api/traces", traceRoutes)

// --- START THE SERVER ---
app.listen(PORT, () => {
    console.log(`\n===============================================`);
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`=================================================\n`);
});