import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Score from '@/models/Score';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

const COIN_MULTIPLIER = 0.5;

export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameSlug, score } = body;

    if (!gameSlug || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Please provide gameSlug and score' },
        { status: 400 }
      );
    }

    if (score < 0 || score > 999999999) {
      return NextResponse.json(
        { error: 'Invalid score value' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const coinsAwarded = Math.floor(score * COIN_MULTIPLIER);

    const existingScore = await Score.findOne({
      userId: authUser.userId,
      gameSlug,
    }).sort({ score: -1 });

    const isNewHighScore = !existingScore || score > existingScore.score;

    const newScore = await Score.create({
      userId: authUser.userId,
      gameSlug,
      score,
      coinsAwarded: isNewHighScore ? coinsAwarded : 0,
    });

    const user = await User.findById(authUser.userId);
    
    if (isNewHighScore) {
      user.coins += coinsAwarded;
      user.totalScore += score;
    }
    user.totalGamesPlayed += 1;
    
    user.gameStats.set(gameSlug, {
      highScore: Math.max(
        (user.gameStats.get(gameSlug)?.highScore || 0),
        score
      ),
      gamesPlayed: (user.gameStats.get(gameSlug)?.gamesPlayed || 0) + 1,
      totalScore: (user.gameStats.get(gameSlug)?.totalScore || 0) + score,
    });
    
    await user.save();

    return NextResponse.json({
      message: 'Score submitted',
      score: {
        id: newScore._id,
        score: newScore.score,
        coinsAwarded: newScore.coinsAwarded,
      },
      isNewHighScore,
      totalCoins: user.coins,
    }, { status: 201 });
  } catch (error) {
    console.error('Submit Score Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug');

    await connectToDatabase();

    const query = { userId: authUser.userId };
    if (gameSlug) {
      query.gameSlug = gameSlug;
    }

    const scores = await Score.find(query)
      .sort({ score: -1 })
      .limit(gameSlug ? 1 : 50)
      .lean();

    return NextResponse.json({
      scores: scores.map(s => ({
        id: s._id,
        gameSlug: s.gameSlug,
        score: s.score,
        coinsAwarded: s.coinsAwarded,
        createdAt: s.createdAt,
      }))
    }, { status: 200 });
  } catch (error) {
    console.error('Get Scores Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}