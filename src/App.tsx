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

const io: any = null;

type Tab = 'play' | 'social' | 'profile' | 'shop' | 'studio' | 'puzzles' | 'analysis';

const NAV_ITEMS: { tab: Tab; icon: any; label: string; emoji: string }[] = [
  { tab: 'play',     icon: Swords,    label: 'Play',     emoji: '⚔️' },
  { tab: 'puzzles',  icon: Puzzle,    label: 'Puzzles',  emoji: '🧩' },
  { tab: 'analysis', icon: LineChart, label: 'Analysis', emoji: '📊' },
  { tab: 'social',   icon: Share2,    label: 'Social',   emoji: '🌐' },
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
    setIsMultiplayer(options.onlineMode === 'friend' && !!io);
    const newRoomId = (options.onlineMode === 'friend' && io) ? nanoid(8) : null;
    setRoomId(newRoomId); setIsHost(true); setIsPlaying(true);
  };

  const cancelMatchmaking = () => {
    if (matchmakingSocket) { matchmakingSocket.emit('leave_matchmaking'); matchmakingSocket.disconnect(); setMatchmakingSocket(null); }
    setIsMatchmaking(false);
  };

  const handleJoin = (joinRoomId: string) => {
    setIsMultiplayer(true); setRoomId(joinRoomId); setIsHost(false);
    setIsPlaying(true); window.history.pushState({}, '', '/join/' + joinRoomId);
  };

  const handleCreateTournament = (data: any) => {
    const t = { id: nanoid(6).toUpperCase(), name: data.name, players: 1, maxPlayers: data.maxPlayers, format: data.format, host: profile?.username || 'Host', minRating: data.minRating, maxRating: data.maxRating, isPrivate: data.isPrivate };
    setTournaments(prev => [...prev, t]);
    setActiveTournamentId(t.id);
  };

  const handleJoinTournament = (tId: string) => setActiveTournamentId(tId);

  const handleBack = () => {
    setIsPlaying(false); setIsMultiplayer(false); setRoomId(null);
    window.history.pushState({}, '', '/');
  };

  const handleSocialTab = () => {
    setActiveTab('social'); setSocialNotifications(0);
    localStorage.setItem('chess_social_notifs', '0');
    if (isPlaying) handleBack();
  };

  const goToTab = (tab: Tab) => {
    if (tab === 'social') { handleSocialTab(); return; }
    setActiveTab(tab);
    if (isPlaying) handleBack();
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }} className="flex h-screen overflow-hidden">

      {/* ── Desktop Sidebar ───────────────── */}
      <nav className="hidden md:flex flex-col h-full z-20"
        style={{ width: 64, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
        
        {/* Logo */}
        <div className="flex items-center justify-center" style={{ height: 64, borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 4px 12px rgba(99,102,241,.4)'
          }}>♟</div>
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col items-center gap-1 py-3">
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
            const isActive = activeTab === tab;
            const hasBadge = tab === 'social' && socialNotifications > 0;
            return (
              <button key={tab} onClick={() => goToTab(tab)} title={label}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all .2s', border: 'none',
                  background: isActive ? 'rgba(99,102,241,.18)' : 'transparent',
                  color: isActive ? 'var(--indigo-bright)' : 'var(--text-3)',
                  position: 'relative',
                }}>
                {isActive && (
                  <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: 'var(--indigo-bright)', borderRadius: '0 3px 3px 0' }} />
                )}
                <Icon size={18} />
                {hasBadge && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Profile mini */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, cursor: 'pointer',
            background: 'linear-gradient(135deg,#f5c842,#e8b800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, color: '#1a1200',
          }} onClick={() => goToTab('profile')}>
            {profile?.username?.slice(0,1).toUpperCase() || 'P'}
          </div>
        </div>
      </nav>

      {/* ── Main Content ──────────────────── */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 72, background: 'var(--bg-primary)' }}>
        {activeTab === 'play' && (
          activeTournamentId ? (
            <TournamentManager
              tournamentId={activeTournamentId}
              tournament={tournaments.find(t => t.id === activeTournamentId) || { id:'', name:'', format:'', maxPlayers:0, minRating:0, maxRating:0, isPrivate:false, host:'' }}
              profile={profile} onLeave={() => setActiveTournamentId(null)}
            />
          ) : isMatchmaking ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24 }}>
              <div className="glass-elevated" style={{ maxWidth:360, width:'100%', textAlign:'center', padding:40 }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
                <h2 style={{ fontSize:22, fontWeight:800, marginBottom:8, color:'var(--text-1)' }}>Finding Opponent...</h2>
                <p style={{ color:'var(--text-2)', marginBottom:32 }}>Waiting for another player to join matchmaking.</p>
                <button onClick={cancelMatchmaking} className="btn btn-ghost" style={{ width:'100%' }}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : isPlaying ? (
            <ChessGame
              initialWhiteTime={timeParams.whiteTime} whiteIncrement={timeParams.whiteInc}
              initialBlackTime={timeParams.blackTime} blackIncrement={timeParams.blackInc}
              hasTimeLimits={timeParams.hasTimeLimits} speedBonus={timeParams.speedBonus}
              isMultiplayer={isMultiplayer} roomId={roomId} isHost={isHost}
              onBack={handleBack} profile={profile} onUpdateProfile={handleUpdateProfile}
            />
          ) : (
            <GameSetup
              onStart={handleStart} onJoin={handleJoin} profile={profile}
              tournaments={tournaments} onCreateTournament={handleCreateTournament}
              onJoinTournament={handleJoinTournament}
            />
          )
        )}
        {activeTab === 'puzzles'  && <Puzzles profile={profile} onUpdateProfile={handleUpdateProfile} />}
        {activeTab === 'analysis' && <AnalysisBoard profile={profile} />}
        {activeTab === 'social'   && <SocialFeed />}
        {activeTab === 'shop'     && <Shop profile={profile} onUpdateProfile={handleUpdateProfile} onNavigateToTab={setActiveTab} />}
        {activeTab === 'studio'   && <StudioWorkspace profile={profile} onUpdateProfile={handleUpdateProfile} />}
        {activeTab === 'profile'  && <Profile profile={profile} onUpdateProfile={handleUpdateProfile} />}
      </main>

      {/* ── Mobile Bottom Nav ─────────────── */}
      <nav className="md:hidden mobile-nav">
        {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
          const isActive = activeTab === tab;
          const hasBadge = tab === 'social' && socialNotifications > 0;
          return (
            <button key={tab} onClick={() => goToTab(tab)}
              className={`mobile-nav-item${isActive ? ' active' : ''}`}
              style={{ background:'transparent', border:'none' }}>
              <div style={{ position:'relative' }}>
                <Icon size={20} />
                {hasBadge && (
                  <span style={{ position:'absolute', top:-2, right:-4, width:7, height:7, borderRadius:'50%', background:'#f43f5e' }} />
                )}
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
