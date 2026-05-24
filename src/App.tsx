import React, { useState, useEffect } from 'react';
import { GameSetup, GameOptions } from './components/GameSetup';
import { ChessGame } from './components/ChessGame';
import { Profile, UserProfile } from './components/Profile';
import { SocialFeed } from './components/SocialFeed';
import { nanoid } from 'nanoid';
import { User, Share2, Play, Search, X, ShoppingCart, Palette, Puzzle, LineChart, Bell } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { Puzzles } from './components/Puzzles';
import { AnalysisBoard } from './components/AnalysisBoard';
import { Shop } from './components/Shop';
import { StudioWorkspace } from './components/StudioWorkspace';
import { TournamentManager } from './components/TournamentManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<'play' | 'social' | 'profile' | 'shop' | 'studio' | 'puzzles' | 'analysis'>('play');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeParams, setTimeParams] = useState({ whiteTime: 600, whiteInc: 0, blackTime: 600, blackInc: 0, hasTimeLimits: true, speedBonus: false });
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingSocket, setMatchmakingSocket] = useState<Socket | null>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [tournaments, setTournaments] = useState<{id: string, name: string, players: number, maxPlayers: number, format: string, host: string, minRating: number, maxRating: number, isPrivate: boolean}[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [socialNotifications, setSocialNotifications] = useState(0);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'join' && pathParts[2]) {
      setIsMultiplayer(true);
      setRoomId(pathParts[2]);
      setIsHost(false);
      setIsPlaying(true);
      setActiveTab('play');
    }

    const saved = localStorage.getItem('chess_profile');
    if (saved) {
      setProfile({ ...JSON.parse(saved) });
    } else {
      setProfile({ username: 'Player', localRating: 1200, coins: 1000000, inventory: ['default'], activeBoardTheme: 'default' });
    }

    // Check for new social notifications
    const savedNotifs = localStorage.getItem('chess_social_notifs') || '0';
    setSocialNotifications(parseInt(savedNotifs));
  }, []);

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('chess_profile', JSON.stringify(newProfile));
  };

  const handleStart = (options: GameOptions) => {
    setTimeParams({ 
      whiteTime: options.whiteTime, 
      whiteInc: options.whiteInc, 
      blackTime: options.blackTime, 
      blackInc: options.blackInc,
      hasTimeLimits: options.hasTimeLimits,
      speedBonus: options.speedBonus
    });
    
    if (options.onlineMode === 'matchmaking') {
      const socket = io();
      setMatchmakingSocket(socket);
      setIsMatchmaking(true);
      
      socket.emit("join_matchmaking", {
        timeParams: { 
          whiteTime: options.whiteTime, 
          whiteInc: options.whiteInc, 
          blackTime: options.blackTime, 
          blackInc: options.blackInc,
          hasTimeLimits: options.hasTimeLimits,
          speedBonus: options.speedBonus
        }
      });

      socket.on("match_found", ({ roomId: matchedRoomId }) => {
        setIsMultiplayer(true);
        setRoomId(matchedRoomId);
        setIsHost(false);
        setIsPlaying(true);
        setIsMatchmaking(false);
        socket.disconnect();
        setMatchmakingSocket(null);
      });
      return;
    }

    setIsMultiplayer(options.onlineMode === 'friend');
    const newRoomId = options.onlineMode === 'friend' ? nanoid(8) : null;
    setRoomId(newRoomId);
    setIsHost(true);
    setIsPlaying(true);
  };

  const cancelMatchmaking = () => {
    if (matchmakingSocket) {
      matchmakingSocket.emit("leave_matchmaking");
      matchmakingSocket.disconnect();
      setMatchmakingSocket(null);
    }
    setIsMatchmaking(false);
  };

  const handleJoin = (joinRoomId: string) => {
    setIsMultiplayer(true);
    setRoomId(joinRoomId);
    setIsHost(false);
    setIsPlaying(true);
    window.history.pushState({}, '', '/join/' + joinRoomId);
  };

  const handleCreateTournament = (data: { name: string, maxPlayers: number, format: string, minRating: number, maxRating: number, isPrivate: boolean }) => {
    const newTournament = {
      id: nanoid(6).toUpperCase(),
      name: data.name,
      players: 1,
      maxPlayers: data.maxPlayers,
      format: data.format,
      host: profile?.username || 'Host',
      minRating: data.minRating,
      maxRating: data.maxRating,
      isPrivate: data.isPrivate
    };
    setTournaments(prev => [...prev, newTournament]);
    setActiveTournamentId(newTournament.id);
  };

  const handleJoinTournament = (tId: string) => {
    setActiveTournamentId(tId);
  };

  const handleBack = () => {
    setIsPlaying(false);
    setIsMultiplayer(false);
    setRoomId(null);
    window.history.pushState({}, '', '/');
  };

  const handleSocialTabClick = () => {
    setActiveTab('social');
    setSocialNotifications(0);
    localStorage.setItem('chess_social_notifs', '0');
    if (isPlaying) handleBack();
  };

  // Desktop Sidebar NavItem with stronger active state
  const DesktopNavItem = ({ tab, icon: Icon, label, hasBadge }: { tab: typeof activeTab, icon: any, label: string, hasBadge?: boolean }) => {
    const isActive = activeTab === tab;
    return (
      <button 
        onClick={() => { 
          if (tab === 'social') {
            handleSocialTabClick();
          } else {
            setActiveTab(tab);
            if (isPlaying) handleBack();
          }
        }}
        className={`relative flex xl:justify-start justify-center items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all w-full group
          ${isActive 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-100' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
      >
        {isActive && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full" />}
        <Icon size={22} className={isActive ? 'text-blue-600' : 'group-hover:text-slate-700'} />
        <span className="hidden xl:block text-sm">{label}</span>
        {hasBadge && socialNotifications > 0 && (
          <span className="absolute top-1 right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {Math.min(socialNotifications, 9)}
          </span>
        )}
      </button>
    );
  };

  // Mobile Bottom NavItem
  const MobileNavItem = ({ tab, icon: Icon, label, hasBadge }: { tab: typeof activeTab, icon: any, label: string, hasBadge?: boolean }) => {
    const isActive = activeTab === tab;
    return (
      <button 
        onClick={() => {
          if (tab === 'social') {
            handleSocialTabClick();
          } else {
            setActiveTab(tab);
            if (isPlaying) handleBack();
          }
        }}
        className={`relative flex flex-col flex-none w-16 items-center gap-1 py-2 px-1 rounded-lg transition-all
          ${isActive 
            ? 'text-blue-600 bg-blue-50' 
            : 'text-slate-500'
          }`}
      >
        <div className="relative">
          <Icon size={22} />
          {hasBadge && socialNotifications > 0 && (
            <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {Math.min(socialNotifications, 9)}
            </span>
          )}
        </div>
        <span className="text-[9px] font-bold truncate">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-600 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex flex-col w-[80px] xl:w-[260px] bg-white h-full shadow-xl z-20 transition-all duration-300 border-r border-slate-100">
        <div className="p-4 pt-6 pb-8 flex items-center justify-center xl:justify-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
            ♟
          </div>
          <span className="hidden xl:block font-extrabold text-xl text-slate-900 tracking-tight">
            <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">Chess</span>
          </span>
        </div>
        
        <div className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
          <DesktopNavItem tab="play" icon={Play} label="Play" />
          <DesktopNavItem tab="puzzles" icon={Puzzle} label="Puzzles" />
          <DesktopNavItem tab="analysis" icon={LineChart} label="Analysis" />
          <DesktopNavItem tab="studio" icon={Palette} label="Design Studio" />
          <DesktopNavItem tab="social" icon={Share2} label="Social" hasBadge={true} />
          <DesktopNavItem tab="shop" icon={ShoppingCart} label="Store" />
          <DesktopNavItem tab="profile" icon={User} label="Profile" />
        </div>

        {/* Footer - User profile on sidebar */}
        <div className="p-3 border-t border-slate-100 hidden xl:block">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              {profile?.username?.slice(0, 1).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{profile?.username || 'Player'}</div>
              <div className="text-xs text-slate-500">Rating: {profile?.localRating || 1200}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 h-full">
        {activeTab === 'play' && (
          activeTournamentId ? (
            <TournamentManager 
              tournamentId={activeTournamentId}
              tournament={tournaments.find(t => t.id === activeTournamentId) || { id: '', name: '', format: '', maxPlayers: 0, minRating: 0, maxRating: 0, isPrivate: false, host: '' }}
              profile={profile}
              onLeave={() => setActiveTournamentId(null)}
            />
          ) : isMatchmaking ? (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-lg max-w-sm w-full text-center">
                <Search className="mx-auto mb-4 text-blue-600 animate-pulse" size={48} />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Finding Opponent...</h2>
                <p className="text-slate-600 mb-8">Waiting for another player to join matchmaking with similar settings.</p>
                
                <button 
                  onClick={cancelMatchmaking}
                  className="w-full bg-slate-50 hover:bg-slate-200 border border-slate-200 text-slate-900 font-medium py-3 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
              </div>
            </div>
          ) : isPlaying ? (
            <ChessGame 
              initialWhiteTime={timeParams.whiteTime} 
              whiteIncrement={timeParams.whiteInc} 
              initialBlackTime={timeParams.blackTime}
              blackIncrement={timeParams.blackInc}
              hasTimeLimits={timeParams.hasTimeLimits}
              speedBonus={timeParams.speedBonus}
              isMultiplayer={isMultiplayer}
              roomId={roomId}
              isHost={isHost}
              onBack={handleBack} 
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
            />
          ) : (
            <GameSetup 
              onStart={handleStart} 
              onJoin={handleJoin} 
              profile={profile} 
              tournaments={tournaments}
              onCreateTournament={handleCreateTournament}
              onJoinTournament={handleJoinTournament}
            />
          )
        )}

        {activeTab === 'puzzles' && <Puzzles profile={profile} onUpdateProfile={handleUpdateProfile} />}
        {activeTab === 'analysis' && <AnalysisBoard profile={profile} />}
        {activeTab === 'social' && <SocialFeed />}
        {activeTab === 'shop' && <Shop profile={profile} onUpdateProfile={handleUpdateProfile} onNavigateToTab={setActiveTab} />}
        {activeTab === 'studio' && <StudioWorkspace profile={profile} onUpdateProfile={handleUpdateProfile} />}
        {activeTab === 'profile' && <Profile profile={profile} onUpdateProfile={handleUpdateProfile} />}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center z-50 safe-area-bottom h-20">
        <MobileNavItem tab="play" icon={Play} label="Play" />
        <MobileNavItem tab="puzzles" icon={Puzzle} label="Puzzles" />
        <MobileNavItem tab="analysis" icon={LineChart} label="Analysis" />
        <MobileNavItem tab="social" icon={Share2} label="Social" hasBadge={true} />
        <MobileNavItem tab="shop" icon={ShoppingCart} label="Shop" />
        <MobileNavItem tab="studio" icon={Palette} label="Studio" />
        <MobileNavItem tab="profile" icon={User} label="Profile" />
      </nav>
    </div>
  );
}
