"use client";

import { useState } from 'react';
import { Trophy, Medal, Crown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const mockLeaderboard = [
  { rank: 1, username: "SpeedKing", score: 15420, game: "Tap Jump", avatar: "👑" },
  { rank: 2, username: "GameMaster99", score: 14850, game: "Endless Runner", avatar: "🎮" },
  { rank: 3, username: "ProGamer_X", score: 13900, game: "Crystal Defense", avatar: "🕹️" },
  { rank: 4, username: "LightningFingers", score: 12500, game: "Quick Tap", avatar: "⚡" },
  { rank: 5, username: "ArcadeChamp", score: 11800, game: "Neon Rider", avatar: "🏆" },
  { rank: 6, username: "PlayerOne", score: 11200, game: "Tap Jump", avatar: "🎯" },
  { rank: 7, username: "NeonNinja", score: 10500, game: "Neon Rider", avatar: "🌟" },
  { rank: 8, username: "RetroFan", score: 9800, game: "Stack Tower", avatar: "👾" },
  { rank: 9, username: "TurboRacer", score: 9200, game: "Car Dodge", avatar: "🏎️" },
  { rank: 10, username: "BrainStorm", score: 8700, game: "Memory Card", avatar: "🧠" },
];

const games = ['All Games', 'Tap Jump', 'Endless Runner', 'Crystal Defense', 'Neon Rider', 'Stack Tower'];

export default function LeaderboardPage() {
  const [selectedGame, setSelectedGame] = useState('All Games');

  const filteredLeaderboard = selectedGame === 'All Games' 
    ? mockLeaderboard 
    : mockLeaderboard.filter(entry => entry.game === selectedGame);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 text-center font-bold text-gray-400">{rank}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Trophy className="w-7 h-7 text-yellow-400" />
          Leaderboard
        </h1>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {games.map((game) => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                selectedGame === game
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {game}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredLeaderboard.map((entry) => (
          <div
            key={`${entry.rank}-${entry.username}`}
            className="flex items-center gap-4 p-4 glass-panel hover:border-cyan-500/30 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
              {entry.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{entry.username}</p>
              <p className="text-xs text-gray-400">{entry.game}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-cyan-400">{entry.score.toLocaleString()}</p>
              <p className="text-xs text-gray-400">points</p>
            </div>
            <div className="w-10 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}