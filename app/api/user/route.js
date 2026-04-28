import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(authUser.userId)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        role: user.role,
        loginStreak: user.loginStreak,
        totalGamesPlayed: user.totalGamesPlayed,
        totalScore: user.totalScore,
        achievements: user.achievements,
        gameStats: Object.fromEntries(user.gameStats || new Map()),
        createdAt: user.createdAt,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, avatar } = body;

    await connectToDatabase();

    const updateFields = {};
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 20 characters' },
          { status: 400 }
        );
      }
      const existing = await User.findOne({ username, _id: { $ne: authUser.userId } });
      if (existing) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
      updateFields.username = username;
    }
    if (avatar) {
      updateFields.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      authUser.userId,
      updateFields,
      { new: true }
    ).select('-password').lean();

    return NextResponse.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}