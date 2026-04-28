"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GameCard from '@/components/ui/GameCard';
import { Search, Grid, List, Gamepad2, X } from 'lucide-react';
import { GAMES_DATA, CATEGORIES_LIST } from '@/lib/data';

export default function GamesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All Games');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const filteredGames = GAMES_DATA.filter(game => {
    const matchesCategory = selectedCategory === 'All Games' || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-cyan-400" />
          All Games
        </h1>
        <span className="text-sm text-gray-400">{GAMES_DATA.length} games</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
        >
          {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
        </button>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES_LIST.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-2">No games found.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All Games'); }}
            className="text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
          : 'space-y-3'
        }>
          {filteredGames.map((game, i) => (
            <div key={game.id} className="animate-in slide-in-from-bottom-4 duration-500">
              <GameCard game={game} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}