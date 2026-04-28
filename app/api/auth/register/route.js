import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide username, email, and password' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      coins: 100,
    });

    const token = await signJwt({
      userId: newUser._id.toString(),
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    });

    const response = NextResponse.json(
      { 
        message: 'Account created successfully', 
        user: { 
          id: newUser._id,
          username: newUser.username, 
          email: newUser.email,
          coins: newUser.coins,
        }
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'playzone_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}