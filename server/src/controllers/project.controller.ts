
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createProjectSchema } from '../validations/project.schema';
import { z } from 'zod';
import crypto from 'crypto';
import { ingestTrace } from '../services/trace.service';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.query;

        if (!orgId || typeof orgId !== 'string') {
            res.status(400).json({ success: false, message: "Organization ID is required" });
            return;
        }

        const projects = await prisma.project.findMany({
            where: {
                organizationId: orgId
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const validatedData = createProjectSchema.parse(req.body);

        // Optional: Ensure the organization actually exists before creating the project
        const orgExists = await prisma.organization.findUnique({
            where: { id: validatedData.organizationId }
        });

        if (!orgExists) {
            res.status(404).json({ success: false, message: "Organization not found" });
            return;
        }

        const project = await prisma.project.create({
            data: {
                name: validatedData.name,
                organizationId: validatedData.organizationId
            }
        });

        res.status(201).json({ success: true, data: project });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        console.error("Error creating project:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// server/src/controllers/project.controller.ts

export const simulateTraffic = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: projectId } = req.params;

        // 1. Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            res.status(404).json({ success: false, message: "Project not found" });
            return;
        }

        const customTraceId = crypto.randomBytes(16).toString('hex');
        const now = Date.now();

        // 2. Pre-generate span IDs to match the new Microservice Saga architecture
        const gatewaySpanId = crypto.randomBytes(8).toString('hex');
        const authSpanId = crypto.randomBytes(8).toString('hex');
        const orchestratorSpanId = crypto.randomBytes(8).toString('hex');
        const cartSpanId = crypto.randomBytes(8).toString('hex');
        const redisSpanId = crypto.randomBytes(8).toString('hex');
        const inventoryLockASpanId = crypto.randomBytes(8).toString('hex');
        const inventoryLockBSpanId = crypto.randomBytes(8).toString('hex');
        const promoSpanId = crypto.randomBytes(8).toString('hex');
        const paymentSpanId = crypto.randomBytes(8).toString('hex');
        const kafkaSpanId = crypto.randomBytes(8).toString('hex');
        const postgresSpanId = crypto.randomBytes(8).toString('hex');
        const notificationSpanId = crypto.randomBytes(8).toString('hex');

        // 3. Ingest Trace first and capture the saved record to get internal DB ID
        const savedTrace = await ingestTrace({
            traceId: customTraceId,
            projectId,
            rootService: 'api-gateway',
            rootOperation: 'POST /api/v2/checkout/process',
            status: 'ERROR',
            startedAt: new Date(now),
            endedAt: new Date(now + 26000), // Updated to match the 26s total duration
            spans: [
                {
                    spanId: gatewaySpanId,
                    serviceName: 'api-gateway',
                    operationName: 'POST /api/v2/checkout/process',
                    startTime: new Date(now),
                    endTime: new Date(now + 26000),
                    status: 'ERROR',
                    errorMessage: '500 Internal Server Error - Cascading Failure'
                },
                {
                    spanId: authSpanId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'auth-service',
                    operationName: 'verify_token_and_limits',
                    startTime: new Date(now + 15),
                    endTime: new Date(now + 40),
                    status: 'OK'
                },
                {
                    spanId: orchestratorSpanId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'order-orchestrator',
                    operationName: 'process_saga_99102',
                    startTime: new Date(now + 80),
                    endTime: new Date(now + 25850),
                    status: 'ERROR',
                    errorMessage: 'Saga Rollback Failed - DB State Inconsistent'
                },
                {
                    spanId: cartSpanId,
                    parentSpanId: orchestratorSpanId,
                    serviceName: 'cart-service',
                    operationName: 'fetch_user_cart',
                    startTime: new Date(now + 120),
                    endTime: new Date(now + 170),
                    status: 'OK'
                },
                {
                    spanId: redisSpanId,
                    parentSpanId: cartSpanId,
                    serviceName: 'redis-cluster',
                    operationName: 'GET user_cart_992',
                    startTime: new Date(now + 125),
                    endTime: new Date(now + 160),
                    status: 'OK'
                },
                {
                    spanId: inventoryLockASpanId,
                    parentSpanId: orchestratorSpanId,
                    serviceName: 'inventory-service',
                    operationName: 'lock_sku_A',
                    startTime: new Date(now + 180),
                    endTime: new Date(now + 210),
                    status: 'OK'
                },
                {
                    spanId: inventoryLockBSpanId,
                    parentSpanId: orchestratorSpanId,
                    serviceName: 'inventory-service',
                    operationName: 'lock_sku_B',
                    startTime: new Date(now + 220),
                    endTime: new Date(now + 280),
                    status: 'OK'
                },
                {
                    spanId: promoSpanId,
                    parentSpanId: orchestratorSpanId,
                    serviceName: 'promotion-service',
                    operationName: 'apply_promo_code',
                    startTime: new Date(now + 300),
                    endTime: new Date(now + 330),
                    status: 'OK'
                },
                {
                    spanId: paymentSpanId,
                    parentSpanId: orchestratorSpanId,
                    serviceName: 'payment-service',
                    operationName: 'braintree_charge',
                    startTime: new Date(now + 380),
                    endTime: new Date(now + 15500),
                    status: 'ERROR',
                    errorMessage: 'Braintree Gateway Timeout (>15000ms)'
                },
                {
                    spanId: kafkaSpanId,
                    parentSpanId: orchestratorSpanId,
                    serviceName: 'kafka-worker',
                    operationName: 'emit_rollback_inventory',
                    startTime: new Date(now + 15580),
                    endTime: new Date(now + 15600),
                    status: 'OK'
                },
                {
                    spanId: postgresSpanId,
                    parentSpanId: orchestratorSpanId,
                    serviceName: 'postgres-cluster',
                    operationName: 'DB_ROLLBACK_TRANSACTION',
                    startTime: new Date(now + 15650),
                    endTime: new Date(now + 25800),
                    status: 'ERROR',
                    errorMessage: 'Connection pool maxed out. Query timeout.'
                },
                {
                    spanId: notificationSpanId,
                    parentSpanId: orchestratorSpanId,
                    serviceName: 'notification-service',
                    operationName: 'dispatch_dead_letter',
                    startTime: new Date(now + 25900),
                    endTime: new Date(now + 25950),
                    status: 'OK'
                }
            ]
        });

        if (!savedTrace) throw new Error("Trace failed to save");

        // 4. Find the internal DB ID for the failure spans
        const dbGatewaySpan = await prisma.span.findUnique({ where: { spanId: gatewaySpanId } });
        const dbOrchestratorSpan = await prisma.span.findUnique({ where: { spanId: orchestratorSpanId } });
        const dbPaymentSpan = await prisma.span.findUnique({ where: { spanId: paymentSpanId } });
        const dbPostgresSpan = await prisma.span.findUnique({ where: { spanId: postgresSpanId } });

        // 5. Generate Incident and Link with savedTrace.id (Internal DB UUID)
        await prisma.incident.create({
            data: {
                title: "Severity 1: Saga Rollback Failure (Order #99102)",
                description: "Auto-generated mock incident. Checkout saga failed due to Braintree timeout, followed by a cascading Postgres pool exhaustion preventing inventory rollback.",
                severity: "critical",
                projectId: projectId,
                events: {
                    create: [
                        { timestamp: new Date(now), level: "INFO", message: "Incoming POST /api/v2/checkout/process", service: "api-gateway", traceRefId: savedTrace.id, spanRefId: dbGatewaySpan?.id },
                        { timestamp: new Date(now + 15), level: "INFO", message: "Authenticating user token and session limits.", service: "auth-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 45), level: "INFO", message: "Routing authenticated request to order-orchestrator", service: "api-gateway", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 80), level: "INFO", message: "Initializing Saga Pattern for Order #99102", service: "order-orchestrator", traceRefId: savedTrace.id, spanRefId: dbOrchestratorSpan?.id },
                        { timestamp: new Date(now + 120), level: "INFO", message: "Fetching user cart items (3 items found).", service: "cart-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 125), level: "INFO", message: "Cache MISS for user_cart_992. Fetching from DB.", service: "redis-cluster", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 180), level: "INFO", message: "Requesting inventory lock for SKU-A.", service: "order-orchestrator", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 200), level: "INFO", message: "Stock reserved for SKU-A.", service: "inventory-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 220), level: "INFO", message: "Requesting inventory lock for SKU-B.", service: "order-orchestrator", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 250), level: "INFO", message: "Stock reserved for SKU-B.", service: "inventory-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 300), level: "INFO", message: "Applying promo code 'SAVE20'", service: "promotion-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 350), level: "INFO", message: "Total calculated: $184.50. Initiating payment sequence.", service: "order-orchestrator", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 380), level: "INFO", message: "Opening connection to Braintree Gateway.", service: "payment-service", traceRefId: savedTrace.id, spanRefId: dbPaymentSpan?.id },
                        { timestamp: new Date(now + 2100), level: "WARNING", message: "Braintree API latency high (>1500ms).", service: "payment-service", traceRefId: savedTrace.id, spanRefId: dbPaymentSpan?.id },
                        { timestamp: new Date(now + 5150), level: "ERROR", message: "Braintree Connection Timeout. Initiating Retry 1/2.", service: "payment-service", traceRefId: savedTrace.id, spanRefId: dbPaymentSpan?.id },
                        { timestamp: new Date(now + 10200), level: "ERROR", message: "Braintree Connection Timeout. Initiating Retry 2/2.", service: "payment-service", traceRefId: savedTrace.id, spanRefId: dbPaymentSpan?.id },
                        { timestamp: new Date(now + 15500), level: "CRITICAL", message: "Payment Gateway Unreachable. Aborting transaction.", service: "payment-service", traceRefId: savedTrace.id, spanRefId: dbPaymentSpan?.id },
                        { timestamp: new Date(now + 15550), level: "INFO", message: "Saga Compensation Triggered: Emitting 'rollback-inventory' event.", service: "order-orchestrator", traceRefId: savedTrace.id, spanRefId: dbOrchestratorSpan?.id },
                        { timestamp: new Date(now + 15580), level: "INFO", message: "Received rollback event. Unlocking SKU-A and SKU-B.", service: "kafka-worker", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 15650), level: "WARNING", message: "Postgres connection pool maxed out (100/100). Queuing rollback query.", service: "postgres-cluster", traceRefId: savedTrace.id, spanRefId: dbPostgresSpan?.id },
                        { timestamp: new Date(now + 25800), level: "ERROR", message: "Query timeout. Failed to unlock inventory in database.", service: "inventory-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 25850), level: "CRITICAL", message: "Saga Rollback Failed! Database state inconsistent for Order #99102.", service: "order-orchestrator", traceRefId: savedTrace.id, spanRefId: dbOrchestratorSpan?.id },
                        { timestamp: new Date(now + 25900), level: "INFO", message: "Dispatching dead-letter alert to engineering team.", service: "notification-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 26000), level: "ERROR", message: "Returning 500 Internal Server Error to client app.", service: "api-gateway", traceRefId: savedTrace.id, spanRefId: dbGatewaySpan?.id }
                    ]
                }
            }
        });

        res.status(200).json({ success: true, message: 'Complex mock traffic generated successfully!' });
    } catch (error) {
        console.error("Simulation Error:", error);
        res.status(500).json({ success: false, message: "Failed to simulate traffic" });
    }
};
