import Link from 'next/link';
import { Play, Star, Gamepad2 } from 'lucide-react';

export default function GameCard({ game, index = 0 }) {
  if (!game || !game.slug) {
    return (
      <div className="group relative block w-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 animate-pulse">
        <div className="aspect-[4/3] w-full bg-gray-800" />
        <div className="p-3">
          <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
          <div className="h-3 w-32 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }
  
  return (
    <Link 
      href={`/play/${game.slug}`} 
      className="group relative block w-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(34,211,238,0.25)]"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-900 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: game?.thumbnail ? `url(${game.thumbnail})` : 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
        
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
          <span className="text-[10px] font-bold text-white">{game.rating || '4.5'}</span>
        </div>

        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.6)]">
            <Play className="w-5 h-5 fill-current text-black ml-0.5" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider text-cyan-300 bg-cyan-900/60 mb-1.5 backdrop-blur-sm uppercase">
            {game.category || 'Arcade'}
          </span>
          <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-cyan-400 transition-colors">
            {game.title || 'Untitled Game'}
          </h3>
          {game.plays && (
            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
              <Gamepad2 className="w-3 h-3" />
              {game.plays} plays
            </p>
          )}
        </div>
      </div>

      {game.featured && (
        <div className="absolute -top-px -right-px">
          <div className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-lg">
            HOT
          </div>
        </div>
      )}
    </Link>
  );
}