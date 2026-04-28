import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Score from '@/models/Score';
import User from '@/models/User';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug');
    const limit = Math.min(parseInt(searchParams.get('limit')) || 10, 100);

    await connectToDatabase();

    let pipeline;

    if (gameSlug) {
      pipeline = [
        { $match: { gameSlug } },
        { $sort: { score: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            score: 1,
            coinsAwarded: 1,
            createdAt: 1,
            username: '$user.username',
            avatar: '$user.avatar',
          }
        },
      ];
    } else {
      pipeline = [
        {
          $group: {
            _id: '$userId',
            totalScore: { $sum: '$score' },
            gamesPlayed: { $sum: 1 },
          }
        },
        { $sort: { totalScore: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            username: '$user.username',
            avatar: '$user.avatar',
            totalScore: 1,
            gamesPlayed: 1,
          }
        },
      ];
    }

    const results = await Score.aggregate(pipeline);

    const leaderboard = results.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      avatar: entry.avatar,
      score: gameSlug ? entry.score : entry.totalScore,
      gamesPlayed: entry.gamesPlayed || 0,
    }));

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}