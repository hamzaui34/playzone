import Link from 'next/link';
import { User, Bell, Coins } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0B0C10]/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            PlayZone
          </span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">1,250</span>
          </div>
          <button className="text-gray-400 hover:text-white transition">
            <Bell className="w-5 h-5" />
          </button>
          <Link href="/login" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
            <User className="w-5 h-5 text-gray-300" />
          </Link>
        </div>
      </div>
    </header>
  );
}
