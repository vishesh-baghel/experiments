/**
 * Signup API Route
 * Creates a new user in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
      },
    });

    // Create default tone config for the user
    await prisma.toneConfig.create({
      data: {
        userId: user.id,
        lowercase: true,
        noEmojis: true,
        noHashtags: true,
        showFailures: true,
        includeNumbers: true,
        learnedPatterns: {},
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
