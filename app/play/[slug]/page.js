"use client";

import { use, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Maximize2, Minimize2, Gamepad2, Trophy, RefreshCw } from 'lucide-react';
import { getGameBySlug, getCoinsForGame } from '@/lib/gameData';
import { 
  saveLastPlayed, 
  getHighScore, 
  saveHighScore, 
  getTargetScore, 
  getChallengeMessage,
  getCoins,
  addCoins
} from '@/lib/storage';

export default function GamePage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const canvasCheckRef = useRef(null);
  
  const game = useMemo(() => getGameBySlug(slug), [slug]);
  const coinsPerWin = useMemo(() => getCoinsForGame(slug), [slug]);
  
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [challenge, setChallenge] = useState(() => getChallengeMessage(slug, 0));
  const [showNewRecord, setShowNewRecord] = useState(false);
  
  const highScore = useMemo(() => getHighScore(slug), [slug]);
  const targetScore = useMemo(() => getTargetScore(slug), [slug]);
  const coinsReward = useMemo(() => coinsPerWin, [coinsPerWin]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0);
      setIsMobile(mobile);
      console.log('[GameLoader] Device detected:', mobile ? 'MOBILE' : 'DESKTOP');
    };
    checkMobile();
  }, []);

  useEffect(() => {
    if (slug && game) {
      saveLastPlayed(slug, { title: game.title });
      console.log('[GameLoader] Game selected:', game.title, game.gameUrl);
    }
  }, [slug, game]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleGameMessage = useCallback((event) => {
    console.log('[GameLoader] Message received:', event.data);
    
    if (!event.data) return;
    
    if (event.data.type === 'gameReady') {
      console.log('[GameLoader] ✅ gameReady received, game is ready!');
      setIsReady(true);
      setLoading(false);
    }
    
    if (event.data.type === 'gameScore') {
      const score = event.data.score || 0;
      setCurrentScore(score);
      
      const challengeInfo = getChallengeMessage(slug, score);
      setChallenge(challengeInfo);
      
      const isNew = saveHighScore(slug, score);
      if (isNew) {
        setShowNewRecord(true);
        addCoins(coinsReward);
        setTimeout(() => setShowNewRecord(false), 3000);
      }
    }
  }, [slug, coinsReward]);

  useEffect(() => {
    window.addEventListener('message', handleGameMessage);
    console.log('[GameLoader] Message listener registered');
    return () => window.removeEventListener('message', handleGameMessage);
  }, [handleGameMessage]);

  const handleRetry = useCallback(() => {
    console.log('[GameLoader] Retrying game load...');
    setLoadingError(false);
    setLoading(true);
    setIsReady(false);
    
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    console.log('[GameLoader] ✅ Iframe onLoad fired');
    
    if (isMobile) {
      console.log('[GameLoader] Mobile: Checking for canvas...');
    }
    
    setLoading(false);
    setIsReady(true);
  }, [isMobile]);

  const handleIframeError = useCallback(() => {
    console.error('[GameLoader] ❌ Iframe failed to load');
    setLoadingError(true);
  }, []);

  useEffect(() => {
    if (!loading || !game?.hasFullGame) return;
    
    console.log('[GameLoader] Loading started, setting timeout...');
    
    const timeout = setTimeout(() => {
      console.log('[GameLoader] Timeout reached, checking state...');
      
      if (isReady) {
        console.log('[GameLoader] Game already ready, ignoring timeout');
        return;
      }
      
      console.log('[GameLoader] Timeout! Showing retry button');
      setLoadingError(true);
      setLoading(false);
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [loading, game?.hasFullGame, isReady]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log('[GameLoader] Fullscreen error:', err);
    }
  };

  if (!game) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-8">This game doesn&apos;t exist yet.</p>
          <button
            onClick={() => router.push('/games')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-full hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Browse Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {showNewRecord && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-3 rounded-full font-bold animate-bounce shadow-lg">
            NEW HIGH SCORE! +{coinsReward} coins!
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/games')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-extrabold text-white">{game.title}</h1>
          <p className="text-xs text-gray-400">{game.category}</p>
        </div>
        <div className="flex gap-2">
          {game.hasFullGame && (
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="glass-panel p-2 text-center">
          <p className="text-[10px] text-gray-400 mb-1">Score</p>
          <p className="text-lg font-bold text-cyan-400">{currentScore}</p>
        </div>
        <div className="glass-panel p-2 text-center">
          <p className="text-[10px] text-gray-400 mb-1">Best</p>
          <p className="text-lg font-bold text-yellow-400">{highScore}</p>
        </div>
        <div className="glass-panel p-2 text-center">
          <p className="text-[10px] text-gray-400 mb-1">Target</p>
          <p className="text-lg font-bold text-green-400">{targetScore}</p>
        </div>
        <div className="glass-panel p-2 text-center">
          <p className="text-[10px] text-gray-400 mb-1">Reward</p>
          <p className="text-lg font-bold text-yellow-500">+{coinsReward}</p>
        </div>
      </div>

      {challenge && (
        <div className={`glass-panel p-3 text-center ${
          challenge.type === 'new_record' ? 'bg-yellow-500/20 border-yellow-500/50' :
          challenge.type === 'target' ? 'bg-green-500/20 border-green-500/50' :
          challenge.type === 'progress' ? 'bg-cyan-500/20 border-cyan-500/50' :
          'bg-white/5'
        }`}>
          <p className={`font-semibold ${
            challenge.type === 'new_record' ? 'text-yellow-400' :
            challenge.type === 'target' ? 'text-green-400' :
            challenge.type === 'progress' ? 'text-cyan-400' :
            'text-gray-400'
          }`}>
            {challenge.message}
          </p>
        </div>
      )}

      <div 
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden glass-panel bg-black transition-all duration-500 ${
          isFullscreen 
            ? 'fixed inset-0 z-[9999] rounded-none w-screen h-screen' 
            : 'w-full aspect-[4/3] md:aspect-video lg:aspect-[16/9]'
        }`}
      >
        {game.hasFullGame ? (
          <>
            {(loading || loadingError) && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0B0C10]/95 z-10">
                <div className="flex flex-col items-center gap-4">
                  {loadingError ? (
                    <>
                      <p className="text-red-400 font-semibold">Game failed to load</p>
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white font-bold rounded-full hover:bg-cyan-400 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retry Game
                      </button>
                      {isMobile && <p className="text-gray-400 text-xs">Check internet connection</p>}
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-cyan-400 font-semibold">Loading {game.title}...</p>
                      <p className="text-gray-500 text-xs">Tap Play in the game when ready</p>
                    </>
                  )}
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={game.gameUrl}
              className="w-full h-full border-0"
              title={game.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-cyan-900/50">
            <div className="w-16 h-16 mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">{game.title}</h2>
            <p className="text-gray-300 mb-4 text-center px-8 text-sm">{game.description}</p>
            <div className="px-6 py-3 bg-yellow-500/20 rounded-xl text-center border border-yellow-500/30">
              <p className="text-yellow-400 font-semibold">Coming Soon!</p>
              <p className="text-gray-400 text-xs mt-1">This game is under development.</p>
            </div>
            <button
              onClick={() => router.push('/games')}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-all"
            >
              Browse Other Games
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          onClick={() => router.push('/games')}
          className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          More Games
        </button>
        <button
          onClick={() => router.push('/leaderboard')}
          className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-all active:scale-95"
        >
          <Trophy className="w-4 h-4" />
          Leaderboard
        </button>
      </div>
    </div>
  );
}