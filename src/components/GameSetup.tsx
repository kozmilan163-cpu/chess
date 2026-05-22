import React, { useState } from 'react';
import { Play, Globe, Users, QrCode, ArrowLeft, Zap, Orbit, Clock, Flame, Settings } from 'lucide-react';
import { UserProfile } from './Profile';

export type OnlineMode = 'local' | 'matchmaking' | 'friend' | 'tournament';

export interface GameOptions {
  whiteTime: number;
  whiteInc: number;
  blackTime: number;
  blackInc: number;
  onlineMode: OnlineMode;
  hasTimeLimits: boolean;
  speedBonus: boolean;
}

interface GameSetupProps {
  onStart: (options: GameOptions) => void;
  onJoin: (roomId: string) => void;
  profile: UserProfile | null;
  tournaments?: {id: string, name: string, players: number, maxPlayers: number, format: string, host: string, minRating: number, maxRating: number, isPrivate?: boolean}[];
  onCreateTournament?: (data: { name: string, maxPlayers: number, format: string, minRating: number, maxRating: number, isPrivate: boolean }) => void;
  onJoinTournament?: (tId: string) => void;
}

type TimeMode = 'bullet' | 'blitz' | 'rapid' | 'classic' | 'custom' | 'none';

export function GameSetup({ onStart, onJoin, profile, tournaments = [], onCreateTournament, onJoinTournament }: GameSetupProps) {
  const [onlineMode, setOnlineMode] = useState<OnlineMode>('local');
  const [speedBonus, setSpeedBonus] = useState(false);
  const [friendJoinCode, setFriendJoinCode] = useState('');
  const [activeMode, setActiveMode] = useState<TimeMode>('rapid');
  const [tournamentTab, setTournamentTab] = useState<'join' | 'create'>('join');
  
  // Tournament form state
  const [tourneyName, setTourneyName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [tourneyFormat, setTourneyFormat] = useState('10 | 0 Rapid');
  const [tourneyType, setTourneyType] = useState<'arena' | 'swiss' | 'knockout'>('arena');
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(3000);
  const [isPrivate, setIsPrivate] = useState(false);

  const [minutes, setMinutes] = useState(10);
  const [increment, setIncrement] = useState(0);

  const [whiteMinutes, setWhiteMinutes] = useState(10);
  const [whiteIncrement, setWhiteIncrement] = useState(0);
  const [blackMinutes, setBlackMinutes] = useState(10);
  const [blackIncrement, setBlackIncrement] = useState(0);

  const setPreset = (m: number, i: number, mode: TimeMode) => {
    setMinutes(m);
    setIncrement(i);
    setWhiteMinutes(m);
    setWhiteIncrement(i);
    setBlackMinutes(m);
    setBlackIncrement(i);
    setActiveMode(mode);
  };

  const calculateAutoTimeOdds = () => {
    if (!profile) return;
    const myRating = profile.chessComRating || profile.localRating;
    const opponentRating = Math.max(800, myRating - 400); // Mock opponent
    const ratingDiff = Math.abs(myRating - opponentRating);
    
    // Simplistic time odds calculation: for every 100 rating points difference, subtract 1 minute from the higher rated player
    let higherRatedTakesOff = Math.floor(ratingDiff / 100);
    const strongerSideMinutes = Math.max(1, 10 - higherRatedTakesOff);

    setWhiteMinutes(myRating > opponentRating ? strongerSideMinutes : 10);
    setBlackMinutes(myRating <= opponentRating ? strongerSideMinutes : 10);
    
    setWhiteIncrement(0);
    setBlackIncrement(0);
    setActiveMode('custom');
  };

  const [tourneyError, setTourneyError] = useState('');

  const handleStart = () => {
    if (onlineMode === 'tournament') {
      if (tournamentTab === 'create' && onCreateTournament) {
        if (!tourneyName.trim()) {
           setTourneyError("Please enter a tournament name.");
           return;
        }
        setTourneyError('');
        onCreateTournament({ 
          name: tourneyName, 
          maxPlayers: tourneyType === 'knockout' ? maxPlayers : 9999, 
          format: `${tourneyFormat} ${tourneyType.toUpperCase()}`,
          minRating: Math.max(0, minRating),
          maxRating: Math.max(0, maxRating),
          isPrivate
        });
        setTournamentTab('join');
        setTourneyName('');
      } else if (tournamentTab === 'join') {
         setTourneyError('Select a tournament from the list below to enter the arena.');
      }
      return;
    }

    const hasTimeLimits = activeMode !== 'none';
    const isCustom = activeMode === 'custom';
    onStart({
      whiteTime: hasTimeLimits ? (isCustom ? whiteMinutes * 60 : minutes * 60) : 0,
      whiteInc: hasTimeLimits ? (isCustom ? whiteIncrement : increment) : 0,
      blackTime: hasTimeLimits ? (isCustom ? blackMinutes * 60 : minutes * 60) : 0,
      blackInc: hasTimeLimits ? (isCustom ? blackIncrement : increment) : 0,
      onlineMode,
      hasTimeLimits,
      speedBonus: hasTimeLimits && onlineMode !== 'local' ? speedBonus : false,
    });
  };

  const RenderPreset = ({ label, m, i, mode, icon: Icon }: { label: string, m: number, i: number, mode: TimeMode, icon: any }) => {
    const isSelected = activeMode === mode && minutes === m && increment === i;
    return (
      <button
        onClick={() => {
          setPreset(m, i, mode);
        }}
        className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg font-bold transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-white'}`}
      >
        <span className="text-lg mb-1">{label}</span>
        <span className="text-[10px] uppercase tracking-wider flex items-center gap-1 opacity-80">
          <Icon size={10} /> {mode}
        </span>
      </button>
    );
  };

  const isModeSelected = (mode: TimeMode) => activeMode === mode;

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-slate-50 text-slate-600 p-4 md:py-12">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
        
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex justify-center mb-2 text-slate-900">
            <h1 className="text-3xl font-extrabold tracking-tight">Play Chess</h1>
          </div>
          
          {/* Connection Modes */}
          <div className="flex bg-slate-100 p-1 rounded-2xl flex-wrap">
            <button 
              onClick={() => setOnlineMode('matchmaking')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs md:text-sm font-bold transition-all ${onlineMode === 'matchmaking' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-white hover:bg-slate-50'}`}
            >
              <Globe size={16} /> Matchmaking
            </button>
            <button 
              onClick={() => setOnlineMode('tournament')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs md:text-sm font-bold transition-all relative ${onlineMode === 'tournament' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-white hover:bg-slate-50'}`}
            >
              <Flame size={16} /> Tournaments
              {tournaments.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-slate-900 text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                  {tournaments.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setOnlineMode('friend')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs md:text-sm font-bold transition-all ${onlineMode === 'friend' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-white hover:bg-slate-50'}`}
            >
              <Users size={16} /> Friend
            </button>
            <button 
              onClick={() => setOnlineMode('local')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs md:text-sm font-bold transition-all ${onlineMode === 'local' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-white hover:bg-slate-50'}`}
            >
              <Orbit size={16} /> Local
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner flex flex-col gap-4">
          
            {onlineMode === 'tournament' ? (
              <div className="py-2">
                 <div className="flex bg-slate-200 p-1 rounded-lg mb-6">
                    <button 
                      onClick={() => setTournamentTab('join')}
                      className={`flex-1 py-2 text-xs font-bold rounded ${tournamentTab === 'join' ? 'bg-slate-50 text-slate-900 shadow' : 'text-slate-500 hover:text-slate-600'}`}
                    >
                      Join Tournament
                    </button>
                    <button 
                      onClick={() => setTournamentTab('create')}
                      className={`flex-1 py-2 text-xs font-bold rounded ${tournamentTab === 'create' ? 'bg-slate-50 text-slate-900 shadow' : 'text-slate-500 hover:text-slate-600'}`}
                    >
                      Create Tournament
                    </button>
                 </div>

                 {tournamentTab === 'create' ? (
                   <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2"><Flame className="text-yellow-600" /> Create a Tournament</h2>
                      <p className="text-slate-600 text-sm mb-4">Set up a custom tournament for you and other players.</p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tournament Name</label>
                          <input 
                            type="text" 
                            value={tourneyName}
                            onChange={(e) => setTourneyName(e.target.value)}
                            placeholder="My Epic Chess Tourney" 
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg pt-3 pb-3 px-4 text-slate-900 mt-1.5 text-sm outline-none focus:border-blue-600 transition-colors" 
                          />
                        </div>
                        <div className="flex gap-4">
                          {tourneyType === 'knockout' && (
                            <div className="flex-1">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Players (Cap)</label>
                              <select 
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                className="w-full bg-slate-100 border border-slate-200 rounded-lg pt-3 pb-3 px-4 text-slate-900 mt-1.5 text-sm outline-none focus:border-blue-600 transition-colors appearance-none"
                              >
                                 {[4, 8, 16, 32, 64, 128].map(v => <option key={v} value={v} className="bg-white">{v} Players</option>)}
                              </select>
                            </div>
                          )}
                          <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Control</label>
                            <select 
                              value={tourneyFormat}
                              onChange={(e) => setTourneyFormat(e.target.value)}
                              className="w-full bg-slate-100 border border-slate-200 rounded-lg pt-3 pb-3 px-4 text-slate-900 mt-1.5 text-sm outline-none focus:border-blue-600 transition-colors appearance-none"
                            >
                               <option className="bg-white">1 | 0 Bullet</option>
                               <option className="bg-white">3 | 0 Blitz</option>
                               <option className="bg-white">5 | 0 Blitz</option>
                               <option className="bg-white">10 | 0 Rapid</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-slate-100 p-4 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                               <Settings size={12} /> Rating Constraints
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{isPrivate ? 'Private' : 'Public'}</span>
                              <button 
                                onClick={() => setIsPrivate(!isPrivate)}
                                className={`w-8 h-4 rounded-full transition-colors relative ${isPrivate ? 'bg-yellow-500' : 'bg-slate-50'}`}
                              >
                                <div className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${isPrivate ? 'left-5' : 'left-0.5'}`} />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Min Rating</label>
                              <input 
                                type="number" 
                                min="0"
                                value={minRating}
                                onChange={(e) => setMinRating(Math.max(0, Number(e.target.value)))}
                                className="w-full bg-slate-100 border border-slate-200 rounded pt-2 pb-2 px-3 text-slate-900 text-sm outline-none focus:border-blue-600"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Max Rating</label>
                              <input 
                                type="number" 
                                min="0"
                                value={maxRating}
                                onChange={(e) => setMaxRating(Math.max(0, Number(e.target.value)))}
                                className="w-full bg-slate-100 border border-slate-200 rounded pt-2 pb-2 px-3 text-slate-900 text-sm outline-none focus:border-blue-600"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 italic">Players outside {minRating}-{maxRating} cannot join. {isPrivate && 'Only visible via direct link/ID.'}</p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tournament Format</label>
                          <div className="grid grid-cols-3 gap-2 mt-1.5">
                            {(['arena', 'swiss', 'knockout'] as const).map(type => (
                              <button
                                key={type}
                                onClick={() => setTourneyType(type)}
                                className={`py-3 px-2 rounded-lg border text-xs font-bold transition-all uppercase tracking-tighter ${tourneyType === type ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-100 border-slate-200 text-slate-500 hover:border-white/30 hover:text-slate-900'}`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 italic px-1">
                            {tourneyType === 'arena' && 'Arena: High-speed, non-stop pairing. Most points wins!'}
                            {tourneyType === 'swiss' && 'Swiss: Non-eliminating. Fixed rounds, winners face winners.'}
                            {tourneyType === 'knockout' && 'Knockout: World Cup style. Lose a game and you are out!'}
                          </p>
                        </div>
                      </div>
                   </div>
                 ) : (
                   <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Available Tournaments</h2>
                     
                     <div className="mb-6 flex gap-2">
                        <input 
                          type="text" 
                          id="tourney_id_input"
                          placeholder="Join by Tournament ID..." 
                          className="flex-1 bg-slate-200 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                        />
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('tourney_id_input') as HTMLInputElement)?.value;
                            if (val) onJoinTournament?.(val.toUpperCase());
                          }}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold px-4 rounded-lg transition-colors border border-slate-200"
                        >
                          Go
                        </button>
                     </div>

                     {tournaments.filter(t => !t.isPrivate).length === 0 ? (
                       <div className="py-8 text-center bg-slate-100 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-500 text-sm">No public tournaments found.</p>
                          <button 
                            onClick={() => setTournamentTab('create')}
                            className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                          >
                            Create the first one!
                          </button>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         {tournaments.filter(t => !t.isPrivate).map(t => (
                           <div key={t.id} className="bg-slate-100 border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-200 transition-colors group">
                             <div>
                               <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                                 {t.name}
                                 <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{t.id}</span>
                               </div>
                               <div className="text-xs text-slate-500 flex items-center gap-3">
                                 <span className="flex items-center gap-1"><Users size={12}/> {t.players}/{t.maxPlayers === 9999 ? '∞' : t.maxPlayers}</span>
                                 <span className="flex items-center gap-1"><Clock size={12}/> {t.format}</span>
                                 {(t.minRating > 0 || t.maxRating < 3000) && (
                                   <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-yellow-600 font-bold">
                                     {t.minRating}-{t.maxRating}
                                   </span>
                                 )}
                               </div>
                             </div>
                             <button 
                               onClick={() => onJoinTournament?.(t.id)}
                               className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-sm shadow opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               Join
                             </button>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
              </div>
            ) : (
              <>
                {/* Time Controls */}
          <div>
            {/* Category tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: 'bullet', label: 'Bullet', icon: Zap },
                { id: 'blitz', label: 'Blitz', icon: Flame },
                { id: 'rapid', label: 'Rapid', icon: Clock },
                { id: 'classic', label: 'Classic', icon: Orbit },
                { id: 'custom', label: 'Custom', icon: Settings },
                { id: 'none', label: 'None', icon: Orbit }
              ].map(mode => (
                <button 
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id as TimeMode)} 
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-bold transition-colors whitespace-nowrap ${activeMode === mode.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Presets Grid */}
            {activeMode !== 'custom' && activeMode !== 'none' && (
              <div className="grid grid-cols-3 gap-2">
                {activeMode === 'bullet' && (
                  <>
                    <RenderPreset label="1 min" m={1} i={0} mode="bullet" icon={Zap} />
                    <RenderPreset label="1 | 1" m={1} i={1} mode="bullet" icon={Zap} />
                    <RenderPreset label="2 | 1" m={2} i={1} mode="bullet" icon={Zap} />
                  </>
                )}
                
                {activeMode === 'blitz' && (
                  <>
                    <RenderPreset label="3 min" m={3} i={0} mode="blitz" icon={Flame} />
                    <RenderPreset label="3 | 2" m={3} i={2} mode="blitz" icon={Flame} />
                    <RenderPreset label="5 min" m={5} i={0} mode="blitz" icon={Flame} />
                  </>
                )}
                
                {activeMode === 'rapid' && (
                  <>
                    <RenderPreset label="10 min" m={10} i={0} mode="rapid" icon={Clock} />
                    <RenderPreset label="15 | 10" m={15} i={10} mode="rapid" icon={Clock} />
                    <RenderPreset label="30 min" m={30} i={0} mode="rapid" icon={Clock} />
                  </>
                )}
                
                {activeMode === 'classic' && (
                  <>
                    <RenderPreset label="60 min" m={60} i={0} mode="classic" icon={Orbit} />
                    <RenderPreset label="90 | 30" m={90} i={30} mode="classic" icon={Orbit} />
                    <RenderPreset label="120 min" m={120} i={0} mode="classic" icon={Orbit} />
                  </>
                )}
              </div>
            )}

            {/* Custom Mode / Time Odds */}
            {activeMode === 'custom' && (
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-100 p-2 rounded">
                    <span className="text-sm font-bold text-slate-900">Custom Clocks</span>
                    {profile && (
                      <button 
                        onClick={calculateAutoTimeOdds}
                        className="text-[10px] uppercase font-bold bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-600/90"
                      >
                        Auto-Calc (Elo)
                      </button>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg flex flex-col gap-3">
                    <div className="font-bold text-slate-900 mb-1 border-l-4 border-white pl-2">White Player</div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Minutes</label>
                        <input type="number" min="1" max="180" value={whiteMinutes} onChange={(e) => setWhiteMinutes(Math.max(1, Number(e.target.value)))} className="w-full bg-slate-200 border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Increment</label>
                        <input type="number" min="0" max="60" value={whiteIncrement} onChange={(e) => setWhiteIncrement(Math.max(0, Number(e.target.value)))} className="w-full bg-slate-200 border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg flex flex-col gap-3">
                    <div className="font-bold text-slate-600 mb-1 border-l-4 border-[#262421] pl-2">Black Player</div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Minutes</label>
                        <input type="number" min="1" max="180" value={blackMinutes} onChange={(e) => setBlackMinutes(Math.max(1, Number(e.target.value)))} className="w-full bg-slate-200 border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Increment</label>
                        <input type="number" min="0" max="60" value={blackIncrement} onChange={(e) => setBlackIncrement(Math.max(0, Number(e.target.value)))} className="w-full bg-slate-200 border border-slate-200 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
            )}
            
            {/* No Time Mode Info */}
            {activeMode === 'none' && (
              <div className="p-6 bg-slate-50 rounded-2xl text-center">
                <Orbit className="mx-auto text-slate-500 mb-2" size={32} />
                <h3 className="text-slate-900 font-bold mb-1">Untimed Match</h3>
                <p className="text-sm text-slate-500">Play at your own pace without the pressure of a ticking clock.</p>
              </div>
            )}
            
            {/* Toggles */}
            {activeMode !== 'none' && (
              <div className="mt-4 space-y-2">
                {onlineMode !== 'local' && (
                  <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <Zap size={14} className="text-blue-600"/> Speed Bonus
                      </span>
                    </div>
                    <button 
                      onClick={() => setSpeedBonus(!speedBonus)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${speedBonus ? 'bg-blue-600' : 'bg-slate-50'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${speedBonus ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </>
          )}
          {/* Win/Lose Payout Stakes Card */}
          {onlineMode !== 'local' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl mt-4 space-y-2.5">
              <div className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5 select-none">
                🪙 Payout Stakes & Rating Telemetry
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-2 rounded-lg border border-blue-50/50 text-center shadow-xs">
                  <div className="text-xs font-black text-green-600">+20 Coins</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">On win</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-50/50 text-center shadow-xs">
                  <div className="text-xs font-black text-slate-500">10 Coins</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">On draw</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-50/50 text-center shadow-xs">
                  <div className="text-xs font-black text-red-500">5 Coins</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">On loss</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 text-center font-semibold leading-normal">
                🏆 Rating adjusts dynamically: <span className="text-green-600 font-extrabold">+15 for Victory</span>, or <span className="text-red-500 font-bold">-10 for Defeat</span>.
              </div>
            </div>
          )}

          {onlineMode === 'friend' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-3.5">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Method A: Host a Lobby</span>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Press the Play button below. You'll receive a private Game Code to share with your opponent.</p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Method B: Enter Lobby Code</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={friendJoinCode}
                    onChange={(e) => setFriendJoinCode(e.target.value.trim())}
                    placeholder="e.g. j1A8kd2p" 
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 font-mono font-bold" 
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (friendJoinCode) onJoin(friendJoinCode);
                    }}
                    disabled={!friendJoinCode}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors disabled:opacity-40 select-none cursor-pointer"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
          
          <div className="pt-4 flex flex-col justify-between gap-3 font-bold relative">
            {tourneyError && (
              <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold text-center border border-red-200">
                {tourneyError}
              </div>
            )}
            <div className="flex gap-3">
              <button 
                onClick={handleStart}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 px-6 rounded-2xl flex items-center justify-center transition-all shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 select-none cursor-pointer"
              >
                {onlineMode === 'tournament' 
                  ? (tournamentTab === 'create' ? 'Create Tournament' : 'Join Arena') 
                  : (onlineMode === 'friend' ? 'Host Lobby' : 'Play')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
