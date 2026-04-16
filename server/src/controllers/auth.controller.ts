// server/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { registerSchema, loginSchema } from '../validations/auth.schema';

// Initializes the Prisma client for database interaction 
const prisma = new PrismaClient();
// Retrieves the secret key for signing JSON Web Tokens from environment variables 
const JWT_SECRET = process.env.JWT_SECRET as string;

// Ensures the application terminates if the critical JWT_SECRET is missing 
if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
}

// Handles new user registration, including organization and default project setup
export const register = async (req: Request, res: Response) => {
    try {
        // Validates incoming request data against the registration schema 
        const data = registerSchema.parse(req.body);

        // Checks the database to prevent duplicate registrations with the same email 
        const existingUser = await prisma.user.findUnique({ 
            where: { email: data.email } 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hashes the user's password using bcrypt for secure storage 
        const passwordHash = await bcrypt.hash(data.password, 10);

        // Executes an atomic transaction to create the user, organization, and a default project 
        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                name: data.name,
                memberships: {
                    create: {
                        role: 'ADMIN', 
                        organization: {
                            create: {
                                name: data.organizationName,
                                slug: data.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                projects: {
                                    create: {
                                        name: 'Default Project' 
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // Includes membership and organization details in the returned user object 
            include: {
                memberships: {
                    include: {
                        organization: true
                    }
                }
            }
        });

        // Generates a JWT valid for 7 days upon successful registration 
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // Identifies the primary organization for the client-side session
        const primaryOrg = user.memberships?.[0]
            ? {
                ...user.memberships[0].organization,
                role: user.memberships[0].role
            }
            : null;

        // Securely attaches the JWT to an HttpOnly cookie
        res.cookie('jwt_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        // Returns user and organization metadata to the client
        return res.status(201).json({
            user: { id: user.id, email: user.email, name: user.name },
            organization: primaryOrg
        });

    } catch (error: any) {
        // Catches and formats Zod validation errors
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Internal server error during registration' });
    }
};

// Authenticates existing users and establishes a secure session
export const login = async (req: Request, res: Response) => {
    try {
        // Validates credentials against the login schema 
        const data = loginSchema.parse(req.body);

        // Attempts to locate the user by email including their organization memberships
        const user = await prisma.user.findUnique({ 
            where: { email: data.email },
            include: {
                memberships: {
                    include: { organization: true }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compares the provided password with the stored hash
        const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Signs a new JWT for the authenticated session 
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Formats organization data for the response
        const organizations = user.memberships?.map(m => ({
            ...m.organization,
            role: m.role
        })) || [];

        // Updates the HttpOnly cookie with the new session token
        res.cookie('jwt_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        return res.status(200).json({
            user: { id: user.id, email: user.email, name: user.name },
            organizations
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Internal server error during login' });
    }
};

// Terminates the user session by clearing the authentication cookie 
export const logout = async (req: Request, res: Response) => {
    res.clearCookie('jwt_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    return res.status(200).json({ message: 'Logged out successfully' });
};