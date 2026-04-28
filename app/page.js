"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FeaturedSlider from '@/components/ui/FeaturedSlider';
import GameCard from '@/components/ui/GameCard';
import { Flame, Star, Zap, Search, TrendingUp, Clock, X, Gamepad2, Play } from 'lucide-react';
import { GAMES_DATA } from '@/lib/data';
import { getLastPlayed, getHighScore } from '@/lib/storage';

const featuredGames = (GAMES_DATA?.filter(g => g.featured) || []).map(g => ({
  title: g.title,
  slug: g.slug,
  description: g.description,
  category: g.category,
  thumbnail: g.thumbnail,
  rating: g.rating,
  plays: g.plays,
  featured: g.featured,
}));

const trendingGames = (GAMES_DATA?.slice(0, 6) || []).map(g => ({
  title: g.title,
  slug: g.slug,
  category: g.category,
  thumbnail: g.thumbnail,
  rating: g.rating,
  plays: g.plays,
}));

const categories = [
  { name: 'All Games', icon: Gamepad2, color: 'text-white bg-white/10 border-white/20' },
  { name: 'Arcade', icon: Zap, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/30' },
  { name: 'Puzzle', icon: Star, color: 'text-purple-400 bg-purple-400/10 border-purple-500/30' },
  { name: 'Runner', icon: Flame, color: 'text-orange-400 bg-orange-400/10 border-orange-500/30' },
  { name: 'Casual', icon: TrendingUp, color: 'text-green-400 bg-green-400/10 border-green-500/30' },
  { name: 'Shooting', icon: Clock, color: 'text-red-400 bg-red-400/10 border-red-500/30' },
];

const newGames = GAMES_DATA.filter(g => g.hasFullGame).slice(0, 5).map(g => ({
  title: g.title,
  slug: g.slug,
  category: g.category,
  thumbnail: g.thumbnail,
  rating: g.rating,
  plays: g.plays,
}));

function ContinuePlaying() {
  const [lastPlayedData, setLastPlayedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    const data = getLastPlayed();
    if (mounted) {
      setLastPlayedData(data);
      setIsLoading(false);
    }
    return () => { mounted = false; };
  }, []);
  
  if (isLoading) {
    return (
      <section className="animate-in slide-in-from-left-4 duration-500">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Play className="w-6 h-6 text-cyan-500" />
            Continue Playing
          </h2>
        </div>
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden glass-panel animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-500">Loading...</span>
          </div>
        </div>
      </section>
    );
  }
  
  if (!lastPlayedData) return null;
  
  const gameData = GAMES_DATA.find(g => g.slug === lastPlayedData.slug);
  const highScore = gameData ? getHighScore(lastPlayedData.slug) : 0;
  
  if (!gameData) return null;
  
  return (
    <section className="animate-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Play className="w-6 h-6 text-cyan-500" />
          Continue Playing
        </h2>
      </div>
      
      <Link 
        href={`/play/${lastPlayedData.slug}`}
        className="group relative flex items-center gap-4 p-4 glass-panel hover:border-cyan-500/50 transition-all"
      >
        <div 
          className="w-24 h-16 rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${gameData.thumbnail})` }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
            {gameData.title}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400">
              Best: <span className="text-yellow-400 font-semibold">{highScore}</span>
            </span>
            {lastPlayedData.score > 0 && (
              <span className="text-xs text-gray-400">
                Last: <span className="text-cyan-400 font-semibold">{lastPlayedData.score}</span>
              </span>
            )}
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-6 h-6 fill-current text-black ml-1" />
        </div>
      </Link>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Games');

  const searchResults = searchQuery.length > 1
    ? GAMES_DATA.filter(game => 
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredTrending = selectedCategory === 'All Games'
    ? trendingGames
    : trendingGames.filter(game => game.category === selectedCategory);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {searchOpen && searchResults.length > 0 && (
        <div className="absolute z-50 w-full max-w-7xl mx-auto left-0 right-0 px-4 mt-2">
          <div className="bg-[#0B0C10]/95 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden shadow-2xl max-h-80 overflow-y-auto">
            <div className="p-2">
              <p className="text-xs text-gray-500 px-3 py-2">Search Results</p>
              {searchResults.map((game) => (
                <button
                  key={game.id}
                  onClick={() => { router.push(`/play/${game.slug}`); setSearchOpen(false); setSearchQuery(''); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${game.thumbnail})` }} />
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{game.title}</p>
                    <p className="text-xs text-gray-400">{game.category}</p>
                  </div>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ContinuePlaying />

      <section>
        <FeaturedSlider games={featuredGames} />
      </section>

      <section className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${isActive ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-transparent' : cat.color}`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-bold text-sm tracking-wide">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Trending Now
          </h2>
          <button 
            onClick={() => router.push('/games')}
            className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            See All
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTrending.map((game, i) => (
            <div key={game.slug} className="animate-in slide-in-from-bottom-8 duration-700">
              <GameCard game={game} index={i} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-500" />
            New Games
          </h2>
          <button 
            onClick={() => router.push('/games')}
            className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            See All
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {newGames.map((game, i) => (
            <div key={game.slug} className="animate-in slide-in-from-bottom-8 duration-700">
              <GameCard game={game} index={i} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}