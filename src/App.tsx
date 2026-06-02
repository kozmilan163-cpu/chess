import React, { useState, useEffect } from 'react';
import { GameSetup, GameOptions } from './components/GameSetup';
import { ChessGame } from './components/ChessGame';
import { Profile, UserProfile } from './components/Profile';
import { SocialFeed } from './components/SocialFeed';
import { nanoid } from 'nanoid';
import { User, Share2, Play, Search, X, ShoppingCart, Palette, Puzzle, LineChart, Trophy, Swords } from 'lucide-react';
import { Puzzles } from './components/Puzzles';
import { AnalysisBoard } from './components/AnalysisBoard';
import { Shop } from './components/Shop';
import { StudioWorkspace } from './components/StudioWorkspace';
import { TournamentManager } from './components/TournamentManager';
import { LeaderboardsEnhanced } from './components/LeaderboardsEnhanced';
import MultiplayerLobby from './components/MultiplayerLobby';
import MultiplayerGameView from './components/MultiplayerGameView';
import { GameRoom } from './utils/multiplayerRealtime';

const io: any = null;

type Tab = 'play' | 'social' | 'profile' | 'shop' | 'studio' | 'puzzles' | 'analysis' | 'multiplayer' | 'leaderboards';

const NAV_ITEMS: { tab: Tab; icon: any; label: string; emoji: string }[] = [
  { tab: 'play',     icon: Swords,    label: 'Play',     emoji: '⚔️' },
  { tab: 'puzzles',  icon: Puzzle,    label: 'Puzzles',  emoji: '🧩' },
  { tab: 'analysis', icon: LineChart, label: 'Analysis', emoji: '📊' },
  { tab: 'social',   icon: Share2,    label: 'Social',   emoji: '🌐' },
  { tab: 'leaderboards', icon: Trophy, label: 'Rankings', emoji: '🏆' },
  { tab: 'shop',     icon: ShoppingCart, label: 'Store', emoji: '🛍️' },
  { tab: 'studio',   icon: Palette,   label: 'Studio',   emoji: '🎨' },
  { tab: 'profile',  icon: User,      label: 'Profile',  emoji: '👤' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('play');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeParams, setTimeParams] = useState({ whiteTime: 600, whiteInc: 0, blackTime: 600, blackInc: 0, hasTimeLimits: true, speedBonus: false });
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingSocket, setMatchmakingSocket] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [socialNotifications, setSocialNotifications] = useState(0);
  const [multiplayerRoom, setMultiplayerRoom] = useState<GameRoom | null>(null);
  const [inMultiplayerGame, setInMultiplayerGame] = useState(false);

  useEffect(() => {
    // Always dark mode
    document.documentElement.classList.add('dark');
    document.documentElement.style.background = '#080810';

    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'join' && pathParts[2]) {
      setIsMultiplayer(true); setRoomId(pathParts[2]);
      setIsHost(false); setIsPlaying(true); setActiveTab('play');
    }
    const saved = localStorage.getItem('chess_profile');
    if (saved) setProfile({ ...JSON.parse(saved) });
    else setProfile({ username: 'Player', localRating: 1200, coins: 1000000, inventory: ['default'], activeBoardTheme: 'default' });
    const savedNotifs = localStorage.getItem('chess_social_notifs') || '0';
    setSocialNotifications(parseInt(savedNotifs));
  }, []);

  const handleUpdateProfile = (p: UserProfile) => {
    setProfile(p);
    localStorage.setItem('chess_profile', JSON.stringify(p));
  };

  const handleStart = (options: GameOptions) => {
    setTimeParams({ whiteTime: options.whiteTime, whiteInc: options.whiteInc, blackTime: options.blackTime, blackInc: options.blackInc, hasTimeLimits: options.hasTimeLimits, speedBonus: options.speedBonus });
    if (options.onlineMode === 'matchmaking' && io) {
      try {
        const socket = io(); setMatchmakingSocket(socket); setIsMatchmaking(true);
        socket.emit('join_matchmaking', { timeParams: options });
        socket.on('match_found', ({ roomId: mid }: { roomId: string }) => {
          setIsMultiplayer(true); setRoomId(mid); setIsHost(false);
          setIsPlaying(true); setIsMatchmaking(false);
          socket.disconnect(); setMatchmakingSocket(null);
        });
      } catch { setIsPlaying(true); }
      return;
    }
    
    // Friend mode — use new multiplayer system
    if (options.onlineMode === 'friend') {
      setActiveTab('multiplayer');
      return;
    }
    
    setIsMultiplayer(false);
    setRoomId(null); setIsHost(true); setIsPlaying(true);
  };

  const handleMultiplayerGameStart = (room: GameRoom) => {
    setMultiplayerRoom(room);
    setInMultiplayerGame(true);
  };

  const handleMultiplayerGameOver = (result: string) => {
    // Handle game over — could save to social feed, update stats, etc.
    console.log('Game over:', result);
    setInMultiplayerGame(false);
  };

  const handleLeaveMultiplayer = () => {
    setMultiplayerRoom(null);
    setInMultiplayerGame(false);
    setActiveTab('play');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Main Content */}
      <div className="h-full overflow-y-auto">
        {activeTab === 'play' && !isPlaying && <GameSetup onStart={handleStart} profile={profile} />}
        {activeTab === 'play' && isPlaying && !isMatchmaking && <ChessGame timeParams={timeParams} profile={profile} onUpdateProfile={handleUpdateProfile} roomId={roomId} isMultiplayer={isMultiplayer} isHost={isHost} />}
        {activeTab === 'play' && isMatchmaking && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin mb-4 w-12 h-12 rounded-full border-4 border-slate-700 border-t-amber-500 mx-auto"></div>
              <p className="text-xl">Finding opponent...</p>
            </div>
          </div>
        )}

        {activeTab === 'multiplayer' && !inMultiplayerGame && profile && (
          <MultiplayerLobby
            playerName={profile.username}
            onJoinGame={handleMultiplayerGameStart}
            onBack={() => setActiveTab('play')}
          />
        )}

        {activeTab === 'multiplayer' && inMultiplayerGame && multiplayerRoom && profile && (
          <MultiplayerGameView
            room={multiplayerRoom}
            playerName={profile.username}
            onGameOver={handleMultiplayerGameOver}
            onLeave={handleLeaveMultiplayer}
          />
        )}

        {activeTab === 'puzzles' && <Puzzles profile={profile} onUpdateProfile={handleUpdateProfile} />}
        {activeTab === 'analysis' && <AnalysisBoard />}
        {activeTab === 'social' && <SocialFeed profile={profile} onUpdateProfile={handleUpdateProfile} notificationCount={socialNotifications} />}
        {activeTab === 'shop' && <Shop profile={profile} onUpdateProfile={handleUpdateProfile} />}
        {activeTab === 'studio' && <StudioWorkspace />}
        {activeTab === 'leaderboards' && profile && <LeaderboardsEnhanced currentUsername={profile.username} currentRating={profile.localRating} currentPlayerId={profile.username} />}
        {activeTab === 'profile' && profile && <Profile profile={profile} onUpdateProfile={handleUpdateProfile} />}
      </div>

      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-between overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.tab}
            onClick={() => { setActiveTab(item.tab); setIsPlaying(false); }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${ activeTab === item.tab ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-xs hidden sm:block">{item.label}</span>
            {item.tab === 'social' && socialNotifications > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{socialNotifications}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
