// server/src/controllers/invitation.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createInvitationSchema, acceptInvitationSchema } from '../validations/invitation.schema';

// Retrieves the secret key for signing authentication tokens from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Manages the creation and distribution of team invitations for an organization
export const createInvitation = async (req: Request, res: Response) => {
    try {
        // Validates the request body against the defined invitation creation schema
        const data = createInvitationSchema.parse(req.body);

        // Checks if the target user is already an active member of the specific organization
        const existingMember = await prisma.user.findUnique({
            where: { email: data.email },
            include: {
                memberships: {
                    where: { organizationId: data.organizationId }
                }
            }
        });

        if (existingMember && existingMember.memberships.length > 0) {
            return res.status(400).json({ error: 'User is already a member of this organization' });
        }

        // Verifies if a pending invitation already exists for this email to prevent duplicate invites
        const existingInvitation = await prisma.invitation.findUnique({
            where: {
                email_organizationId: {
                    email: data.email,
                    organizationId: data.organizationId
                }
            }
        });

        if (existingInvitation) {
            return res.status(400).json({ error: 'An invitation is already pending for this email' });
        }

        // Generates a cryptographically secure 32-byte random token for the invite link
        const token = crypto.randomBytes(32).toString('hex');
        
        // Sets the invitation expiration date to 7 days from the current time
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); 

        // Persists the new invitation record in the database with the assigned role and token
        const invitation = await prisma.invitation.create({
            data: {
                email: data.email,
                organizationId: data.organizationId,
                role: data.role,
                token,
                expiresAt
            }
        });

        // Returns the formatted secure invitation link to the client for distribution
        return res.status(201).json({
            success: true,
            message: 'Invitation created successfully',
            data: {
                inviteLink: `http://localhost:5173/invite/${token}`
            }
        });

    } catch (error: any) {
        // Formats and returns Zod-specific validation errors if the input is malformed
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Error creating invitation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Processes invitation acceptance, account creation, and organization linking
export const acceptInvitation = async (req: Request, res: Response) => {
    try {
        // Validates the acceptance payload including user name and new password
        const data = acceptInvitationSchema.parse(req.body);

        // Validates the token and retrieves the associated organization metadata
        const invitation = await prisma.invitation.findUnique({
            where: { token: data.token },
            include: { organization: true }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invalid or expired invitation token' });
        }

        // Checks the current timestamp against the invitation's expiration date
        if (new Date() > invitation.expiresAt) {
            // Automatically purges the expired invitation from the database
            await prisma.invitation.delete({ where: { id: invitation.id } });
            return res.status(400).json({ error: 'This invitation has expired' });
        }

        // Attempts to find an existing user account associated with the invite email
        let user = await prisma.user.findUnique({
            where: { email: invitation.email },
            include: { memberships: { include: { organization: true } } }
        });

        if (!user) {
            // Hashes the provided password and creates a new user account if one does not exist
            const passwordHash = await bcrypt.hash(data.password, 10);
            user = await prisma.user.create({
                data: {
                    email: invitation.email,
                    name: data.name,
                    passwordHash,
                    memberships: {
                        create: {
                            organizationId: invitation.organizationId,
                            role: invitation.role
                        }
                    }
                },
                include: { memberships: { include: { organization: true } } }
            });
        } else {
            // Links an existing user account to the new organization with the invited role
            await prisma.organizationMember.create({
                data: {
                    userId: user.id,
                    organizationId: invitation.organizationId,
                    role: invitation.role
                }
            });
            // Re-fetches the user record to include the newly added organization membership
            user = await prisma.user.findUnique({
                where: { id: user.id },
                include: { memberships: { include: { organization: true } } }
            });
        }

        // Deletes the invitation record to ensure the single-use token cannot be reused
        await prisma.invitation.delete({
            where: { id: invitation.id }
        });

        // Signs a new JWT for the user to facilitate an immediate authenticated login
        const jwtToken = jwt.sign(
            { id: user!.id, email: user!.email },
            JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // Extracts all authorized organizations for the user's session context
        const organizations = user!.memberships.map(m => m.organization);

        // Returns the authentication token and user profile details to the client
        return res.status(200).json({
            token: jwtToken,
            user: {
                id: user!.id,
                email: user!.email,
                name: user!.name
            },
            organizations
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Error accepting invitation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};