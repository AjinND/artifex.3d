import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public isOperational: boolean = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function handleError(error: unknown) {
    console.error('API request failed', (error as Error)?.name);

    // Custom app errors
    if (error instanceof AppError) {
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: error.statusCode });
    }

    // Zod validation errors
    if (error instanceof ZodError) {
        return NextResponse.json({
            success: false,
            error: 'Validation failed',
            details: error.issues.map((e: any) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        }, { status: 400 });
    }

    // MongoDB duplicate key error
    if ((error as any)?.name === 'MongoServerError' && (error as any)?.code === 11000) {
        return NextResponse.json({
            success: false,
            error: 'Duplicate entry exists',
        }, { status: 409 });
    }

    // MongoDB cast error (invalid ObjectId)
    if ((error as any)?.name === 'CastError') {
        return NextResponse.json({
            success: false,
            error: 'Invalid ID format',
        }, { status: 400 });
    }

    // JWT errors
    if ((error as any)?.name === 'JsonWebTokenError') {
        return NextResponse.json({
            success: false,
            error: 'Invalid token',
        }, { status: 401 });
    }

    if ((error as any)?.name === 'TokenExpiredError') {
        return NextResponse.json({
            success: false,
            error: 'Token expired',
        }, { status: 401 });
    }

    // Generic server error
    return NextResponse.json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : (error as Error)?.message || 'Unknown error',
    }, { status: 500 });
}
