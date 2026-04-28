"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';

export default function FeaturedSlider({ games = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % games.length);
  }, [games.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + games.length) % games.length);
  }, [games.length]);

  useEffect(() => {
    if (!games?.length) return;
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [games.length, goToNext]);

  if (!games || games.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden mb-6 shadow-2xl glass-panel flex items-center justify-center">
        <span className="text-gray-500">No featured games</span>
      </div>
    );
  }

  const activeGame = games[activeIndex];

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden mb-6 shadow-2xl group">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
        style={{ backgroundImage: `url(${activeGame.thumbnail})` }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10]/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0B0C10]/60 via-transparent to-transparent" />
      </div>

      <button
        onClick={(e) => { e.preventDefault(); goToPrev(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-110"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={(e) => { e.preventDefault(); goToNext(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-110"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end z-10">
        <div className="max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-purple-300 bg-purple-900/50 mb-3 border border-purple-500/30 uppercase backdrop-blur-md">
            <Sparkles className="w-3 h-3" />
            Featured
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">
            {activeGame.title}
          </h2>
          <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-5 opacity-90">
            {activeGame.description}
          </p>
          <Link 
            href={`/play/${activeGame.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          >
            <Play className="w-5 h-5 fill-current" />
            Play Now
          </Link>
        </div>
      </div>

      <div className="absolute bottom-4 right-6 md:bottom-6 md:right-10 flex gap-2 z-20">
        {games.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all duration-500 ${
              idx === activeIndex 
                ? "w-8 bg-gradient-to-r from-purple-500 to-cyan-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                : "w-2 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-6 left-6 md:bottom-6 md:left-10 z-20 text-xs text-white/50">
        {activeIndex + 1} / {games.length}
      </div>
    </div>
  );
}