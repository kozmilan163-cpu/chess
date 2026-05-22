import React, { useState, useEffect } from 'react';
import { GameSetup, GameOptions } from './components/GameSetup';
import { ChessGame } from './components/ChessGame';
import { Profile, UserProfile } from './components/Profile';
import { SocialFeed } from './components/SocialFeed';
import { nanoid } from 'nanoid';
import { User, Share2, Play, Search, X, ShoppingCart, Palette, Puzzle, LineChart } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { Puzzles } from './components/Puzzles';
import { AnalysisBoard } from './components/AnalysisBoard';
import { Shop } from './components/Shop';
import { StudioWorkspace } from './components/StudioWorkspace';
import { TournamentArena } from './components/TournamentArena';

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
        setIsHost(false); // In matchmaking, host doesn't matter much for setup, both have same params
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

  const NavItem = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button 
        onClick={() => { setActiveTab(tab); if (isPlaying) handleBack(); }}
        className={`flex xl:justify-start justify-center items-center gap-4 p-3 xl:px-4 rounded-2xl font-bold transition-all w-full
          ${isActive 
            ? 'bg-slate-100 text-blue-600' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
      >
        <Icon size={24} className={isActive ? 'text-blue-600' : ''} />
        <span className="hidden xl:block">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-600 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex flex-col w-[80px] xl:w-[240px] bg-white h-full shadow-xl z-20 transition-all duration-300">
        <div className="p-4 pt-6 pb-8 flex items-center justify-center xl:justify-start gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">C</div>
          <span className="hidden xl:block font-extrabold text-2xl text-slate-900 tracking-tight">Social <span className="text-blue-600">Chess</span></span>
        </div>
        
        <div className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto">
          <NavItem tab="play" icon={Play} label="Play" />
          <NavItem tab="puzzles" icon={Puzzle} label="Puzzles" />
          <NavItem tab="analysis" icon={LineChart} label="Analysis" />
          <NavItem tab="studio" icon={Palette} label="Design Studio" />
          <NavItem tab="social" icon={Share2} label="Social Tools" />
          <NavItem tab="shop" icon={ShoppingCart} label="Store" />
          <NavItem tab="profile" icon={User} label="Profile" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 h-full">
        {activeTab === 'play' && (
          activeTournamentId ? (
            <TournamentArena 
              tournamentId={activeTournamentId}
              tournaments={tournaments}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 safe-area-bottom overflow-x-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('play'); if (isPlaying) handleBack(); }}
          className={`flex flex-col flex-none w-14 items-center gap-1 ${activeTab === 'play' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Play size={20} />
          <span className="text-[10px] font-bold">Play</span>
        </button>
        <button 
          onClick={() => { setActiveTab('puzzles'); if (isPlaying) handleBack(); }}
          className={`flex flex-col flex-none w-14 items-center gap-1 ${activeTab === 'puzzles' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Puzzle size={20} />
          <span className="text-[10px] font-bold">Puzzles</span>
        </button>
        <button 
          onClick={() => { setActiveTab('analysis'); if (isPlaying) handleBack(); }}
          className={`flex flex-col flex-none w-14 items-center gap-1 ${activeTab === 'analysis' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <LineChart size={20} />
          <span className="text-[10px] font-bold">Analysis</span>
        </button>
        <button 
          onClick={() => { setActiveTab('social'); if (isPlaying) handleBack(); }}
          className={`flex flex-col flex-none w-14 items-center gap-1 ${activeTab === 'social' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Share2 size={20} />
          <span className="text-[10px] font-bold">Social</span>
        </button>
        <button 
          onClick={() => { setActiveTab('shop'); if (isPlaying) handleBack(); }}
          className={`flex flex-col flex-none w-14 items-center gap-1 ${activeTab === 'shop' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <ShoppingCart size={20} />
          <span className="text-[10px] font-bold">Shop</span>
        </button>
        <button 
          onClick={() => { setActiveTab('studio'); if (isPlaying) handleBack(); }}
          className={`flex flex-col flex-none w-14 items-center gap-1 ${activeTab === 'studio' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <Palette size={20} />
          <span className="text-[10px] font-bold">Studio</span>
        </button>
        <button 
          onClick={() => { setActiveTab('profile'); if (isPlaying) handleBack(); }}
          className={`flex flex-col flex-none w-14 items-center gap-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <User size={20} />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>
    </div>
  );
}
