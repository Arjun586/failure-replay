
import dotenv from 'dotenv';
// Loads environment variables from a .env file into process.env 
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import incidentRoutes from './routes/incident.routes';
import uploadRoutes from './routes/upload.routes';
import authRoutes from './routes/auth.routes';
import invitationRoutes from './routes/invitation.routes';
import projectRoutes from './routes/project.routes';
import cookieParser from 'cookie-parser';
import traceRoutes from './routes/trace.routes';

// Initializes the Express application instance 
const app = express();

// Sets the server port from environment variables or defaults to 5000 
const PORT = process.env.PORT || 5000;// --- PRODUCTION MIDDLEWARES ---

// Secures the app by setting various HTTP headers 
app.use(helmet());

// Enables Cross-Origin Resource Sharing for the specified client URL 
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Parses incoming requests with JSON payloads up to 50mb 
app.use(express.json({ limit: '50mb' }));

// Parses incoming requests with urlencoded payloads 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Parses Cookie header and populates req.cookies 
app.use(cookieParser());

// Logs HTTP requests to the console for development debugging 
app.use(morgan('dev'));

// --- ROUTES ---
// Provides a basic endpoint to verify API availability 
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', message: 'ReplayOS API is running smoothly. 🚀' });
});

// Mounts incident management routes 
app.use('/api/incidents', incidentRoutes);

// Mounts file upload and log parsing routes 
app.use('/api/upload', uploadRoutes);

// Mounts authentication and session routes 
app.use('/api/auth', authRoutes);

// Mounts team invitation and onboarding routes 
app.use('/api/invites', invitationRoutes);

// Mounts project and workspace management routes 
app.use('/api/projects', projectRoutes);

// Mounts distributed tracing and OTLP ingestion routes 
app.use("/api/traces", traceRoutes)

// --- START THE SERVER ---
// Begins listening for connections on the configured port 
app.listen(PORT, () => {
    console.log("\===============================================");
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log("=================================================\n");
});