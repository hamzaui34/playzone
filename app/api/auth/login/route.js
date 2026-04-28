import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/auth';

function getDaysDiff(date1, date2) {
  const diffTime = Math.abs(date1 - date2);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide email and password' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    let dailyBonus = 0;
    const now = new Date();
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

    if (!lastLogin) {
      dailyBonus = 50;
      user.loginStreak = 1;
    } else {
      const daysSinceLastLogin = getDaysDiff(now, lastLogin);
      if (daysSinceLastLogin === 1) {
        user.loginStreak += 1;
        dailyBonus = Math.min(user.loginStreak * 10, 100);
      } else if (daysSinceLastLogin > 1) {
        user.loginStreak = 1;
        dailyBonus = 10;
      }
    }

    if (dailyBonus > 0) {
      user.coins += dailyBonus;
    }

    user.lastLogin = now;
    await user.save();

    const token = await signJwt({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json(
      { 
        message: 'Logged in successfully', 
        user: { 
          id: user._id,
          username: user.username, 
          email: user.email,
          coins: user.coins,
          loginStreak: user.loginStreak,
          role: user.role,
        },
        dailyBonus,
      },
      { status: 200 }
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
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}