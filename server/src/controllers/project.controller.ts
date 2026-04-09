
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


export const simulateTraffic = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: projectId } = req.params;

        // 1. Verify project exists [cite: 819-820]
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            res.status(404).json({ success: false, message: "Project not found" });
            return;
        }

        const customTraceId = crypto.randomBytes(16).toString('hex');
        const now = Date.now();

        // 2. Pre-generate span IDs [cite: 738]
        const gatewaySpanId = crypto.randomBytes(8).toString('hex');
        const authSpanId = crypto.randomBytes(8).toString('hex');
        const userServiceId = crypto.randomBytes(8).toString('hex');
        const cartSpanId = crypto.randomBytes(8).toString('hex');
        const redisSpanId = crypto.randomBytes(8).toString('hex');
        const inventorySpanId = crypto.randomBytes(8).toString('hex');
        const dbSpanId = crypto.randomBytes(8).toString('hex');
        const promoSpanId = crypto.randomBytes(8).toString('hex');
        const paymentSpanId = crypto.randomBytes(8).toString('hex');
        const stripeSpanId = crypto.randomBytes(8).toString('hex');
        const notificationSpanId = crypto.randomBytes(8).toString('hex');

        // 3. Ingest Trace first and capture the saved record to get internal DB ID [cite: 997-1004]
        const savedTrace = await ingestTrace({
            traceId: customTraceId,
            projectId,
            rootService: 'api-gateway',
            rootOperation: 'POST /api/v1/checkout',
            status: 'ERROR',
            startedAt: new Date(now),
            endedAt: new Date(now + 3100),
            spans: [
                {
                    spanId: gatewaySpanId,
                    serviceName: 'api-gateway',
                    operationName: 'POST /api/v1/checkout',
                    startTime: new Date(now),
                    endTime: new Date(now + 3100),
                    status: 'ERROR',
                    errorMessage: '500 Internal Server Error - Payment Gateway Timeout'
                },
                {
                    spanId: authSpanId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'auth-service',
                    operationName: 'verify_jwt',
                    startTime: new Date(now + 10),
                    endTime: new Date(now + 45),
                    status: 'OK'
                },
                {
                    spanId: userServiceId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'user-service',
                    operationName: 'fetch_profile',
                    startTime: new Date(now + 50),
                    endTime: new Date(now + 120),
                    status: 'OK'
                },
                {
                    spanId: cartSpanId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'cart-service',
                    operationName: 'validate_cart_items',
                    startTime: new Date(now + 125),
                    endTime: new Date(now + 200),
                    status: 'OK'
                },
                {
                    spanId: redisSpanId,
                    parentSpanId: cartSpanId,
                    serviceName: 'redis-cluster',
                    operationName: 'GET user_cart_992',
                    startTime: new Date(now + 130),
                    endTime: new Date(now + 180),
                    status: 'OK'
                },
                {
                    spanId: inventorySpanId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'inventory-service',
                    operationName: 'reserve_stock',
                    startTime: new Date(now + 205),
                    endTime: new Date(now + 400),
                    status: 'OK'
                },
                {
                    spanId: dbSpanId,
                    parentSpanId: inventorySpanId,
                    serviceName: 'postgres-db',
                    operationName: 'UPDATE inventory SET locked = true',
                    startTime: new Date(now + 220),
                    endTime: new Date(now + 380),
                    status: 'OK'
                },
                {
                    spanId: promoSpanId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'promotion-service',
                    operationName: 'apply_discount_codes',
                    startTime: new Date(now + 405),
                    endTime: new Date(now + 480),
                    status: 'OK'
                },
                {
                    spanId: paymentSpanId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'payment-service',
                    operationName: 'process_charge',
                    startTime: new Date(now + 485),
                    endTime: new Date(now + 2985),
                    status: 'ERROR',
                    errorMessage: 'Stripe API Connection Timeout after 2500ms'
                },
                {
                    spanId: stripeSpanId,
                    parentSpanId: paymentSpanId,
                    serviceName: 'stripe-api',
                    operationName: 'POST /v1/charges',
                    startTime: new Date(now + 490),
                    endTime: new Date(now + 2980),
                    status: 'ERROR',
                    errorMessage: 'ERR_CONNECTION_TIMEOUT'
                },
                {
                    spanId: notificationSpanId,
                    parentSpanId: gatewaySpanId,
                    serviceName: 'notification-service',
                    operationName: 'send_failure_email',
                    startTime: new Date(now + 3000),
                    endTime: new Date(now + 3080),
                    status: 'OK'
                }
            ]
        });

        if (!savedTrace) throw new Error("Trace failed to save");

        // 4. Find the internal DB ID for the failure spans [cite: 733-734]
        const dbPaymentSpan = await prisma.span.findUnique({ where: { spanId: paymentSpanId } });
        const dbGatewaySpan = await prisma.span.findUnique({ where: { spanId: gatewaySpanId } });

        // 5. Generate Incident and Link with savedTrace.id (Internal DB UUID) [cite: 729-734]
        await prisma.incident.create({
            data: {
                title: "Severity 1: Stripe API Connection Timeout",
                description: "Auto-generated mock incident. Checkout flow failed due to upstream payment gateway latency.",
                severity: "critical",
                projectId: projectId,
                events: {
                    create: [
                        { timestamp: new Date(now), level: "INFO", message: "Incoming POST /api/v1/checkout", service: "api-gateway", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 130), level: "INFO", message: "Cache hit for user_cart_992", service: "cart-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 220), level: "INFO", message: "Acquired lock on 3 SKU items", service: "inventory-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 490), level: "INFO", message: "Initiating charge of $142.50 via Stripe", service: "payment-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 2980), level: "ERROR", message: "Stripe API Connection Timeout after 2500ms. Aborting.", service: "payment-service", traceRefId: savedTrace.id, spanRefId: dbPaymentSpan?.id },
                        { timestamp: new Date(now + 3000), level: "INFO", message: "Queueing failure email to user", service: "notification-service", traceRefId: savedTrace.id },
                        { timestamp: new Date(now + 3100), level: "CRITICAL", message: "Checkout failed. Returned 500 to client.", service: "api-gateway", traceRefId: savedTrace.id, spanRefId: dbGatewaySpan?.id }
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
