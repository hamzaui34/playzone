"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, Trophy, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Games', icon: Gamepad2, href: '/games' },
  { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
  { label: 'Profile', icon: User, href: '/login' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on specific pages like game play
  if (pathname.startsWith('/play/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0C10]/90 backdrop-blur-lg border-t border-white/5 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 relative group"
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-b-md" />
              )}
              <Icon 
                className={twMerge(
                  clsx(
                    "w-6 h-6 transition-all duration-300",
                    isActive ? "text-cyan-400 scale-110" : "text-gray-500 group-hover:text-gray-300"
                  )
                )} 
              />
              <span className={twMerge(
                clsx(
                  "text-[10px] font-medium transition-colors duration-300",
                  isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"
                )
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
