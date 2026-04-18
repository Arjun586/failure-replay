import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { parseLogFile } from '../services/parser.service';

// 1. Connect to Upstash
// Upstash requires 'maxRetriesPerRequest: null' for BullMQ to work
const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

// 2. Create the Queue (The "Inbox")
export const logQueue = new Queue('log-processing', { connection });

// 3. Create the Worker (The "Processor")
const logWorker = new Worker('log-processing', async (job) => {
    const { filePath, originalName, projectId } = job.data;
    
    console.log(`[Worker] 🚀 Processing logs for: ${originalName}`);
    
    // This calls your existing parsing logic
    await parseLogFile(filePath, originalName, projectId);
    
    return { status: 'completed' };
}, { connection });

logWorker.on('completed', (job) => console.log(`Job ${job.id} finished!`));
logWorker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));