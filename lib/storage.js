const STORAGE_KEYS = {
  LAST_PLAYED: 'playzone_last_played',
  HIGH_SCORES: 'playzone_high_scores',
  GAME_PROGRESS: 'playzone_progress_',
  DAILY_STREAK: 'playzone_daily_streak',
  TOTAL_COINS: 'playzone_total_coins',
};

export function saveLastPlayed(slug, gameData = {}) {
  try {
    const data = {
      slug,
      playedAt: Date.now(),
      title: gameData.title || slug,
      score: gameData.score || 0,
    };
    localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save last played:', e);
  }
}

export function getLastPlayed() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function getHighScore(slug) {
  try {
    const scores = getAllHighScores();
    return scores[slug] || 0;
  } catch (e) {
    return 0;
  }
}

export function saveHighScore(slug, score) {
  if (!slug || typeof score !== 'number') return false;
  
  try {
    const scores = getAllHighScores();
    const currentHigh = scores[slug] || 0;
    
    if (score > currentHigh) {
      scores[slug] = score;
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to save high score:', e);
    return false;
  }
}

export function getAllHighScores() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

export function saveGameProgress(slug, progressData) {
  if (!slug) return;
  
  try {
    const key = STORAGE_KEYS.GAME_PROGRESS + slug;
    const data = {
      ...progressData,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function getGameProgress(slug) {
  if (!slug) return null;
  
  try {
    const key = STORAGE_KEYS.GAME_PROGRESS + slug;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function clearGameProgress(slug) {
  if (!slug) return;
  
  try {
    const key = STORAGE_KEYS.GAME_PROGRESS + slug;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear progress:', e);
  }
}

export function getCoins() {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_COINS)) || 0;
  } catch (e) {
    return 0;
  }
}

export function addCoins(amount) {
  if (typeof amount !== 'number' || amount <= 0) return;
  
  try {
    const current = getCoins();
    localStorage.setItem(STORAGE_KEYS.TOTAL_COINS, (current + amount).toString());
  } catch (e) {
    console.error('Failed to add coins:', e);
  }
}

export const TARGET_SCORES = {
  'tap-jump': 100,
  'snake': 50,
  'tic-tac-toe': 10,
  'bubble-pop': 500,
  'fruit-slice': 200,
  'quiz-rush': 500,
  'bubble-shooter': 1000,
  'endless-runner': 1000,
  'neon-rider': 500,
  'crystal-defense': 200,
  'stack-tower': 50,
  'cosmic-blast': 1000,
  'car-dodge': 500,
};

export function getTargetScore(slug) {
  return TARGET_SCORES[slug] || 100;
}

export function isNewRecord(slug, score) {
  return score > getHighScore(slug);
}

export function getChallengeMessage(slug, score) {
  const highScore = getHighScore(slug);
  const target = getTargetScore(slug);
  
  if (score > highScore) {
    return {
      type: 'new_record',
      message: `🎉 NEW HIGH SCORE! You beat your record of ${highScore}!`,
    };
  }
  if (score >= target) {
    return {
      type: 'target',
      message: `🏆 Challenge Complete! You reached ${score}!`,
    };
  }
  if (score > highScore * 0.5) {
    return {
      type: 'progress',
      message: `📈 Good progress! ${score}/${target} - Keep going!`,
    };
  }
  return {
    type: 'start',
    message: `Target: ${target} points to win!`,
  };
}