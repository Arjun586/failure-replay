// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { logWorker } from '../workers/log.worker';

// Retrieves the database connection string from environment variables
const dbUrl = process.env.DATABASE_URL || '';

// Determines the correct character to append connection pooling parameters
const separator = dbUrl.includes('?') ? '&' : '?';

// Initializes the Prisma Client with environment-specific logging and connection limits
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: `${dbUrl}${separator}connection_limit=10&pgbouncer=true`,
        },
    },
});

// Ensures the database connection is closed gracefully when the process terminates
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    //Tell the worker to stop taking new jobs and finish active ones
    await logWorker.close();
    // Disconnect DB
    await prisma.$disconnect();
    process.exit(0);
});