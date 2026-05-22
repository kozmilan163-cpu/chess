import React, { useState, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { UserProfile, GeneratedTheme } from './Profile';
import { Palette, PlaySquare, Sparkles, Plus, Trash2, Coins, FolderHeart, RotateCcw, Upload, Info, Image as ImageIcon } from 'lucide-react';
import { THEMES } from './Shop';

const BOARD_THEME_OPTIONS = THEMES.filter(t => !t.pieces);

const STATIC_PRESET_IMAGES: Record<string, Record<string, { name: string, url: string }>> = {
  classical: {
    wP: { name: 'Championship Pawn', url: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg' },
    wN: { name: 'Championship Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg' },
    wB: { name: 'Championship Bishop', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg' },
    wR: { name: 'Championship Rook', url: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg' },
    wQ: { name: 'Championship Queen', url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg' },
    wK: { name: 'Championship King', url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg' },
    bP: { name: 'Championship Pawn (Dark)', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg' },
    bN: { name: 'Championship Knight (Dark)', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg' },
    bB: { name: 'Championship Bishop (Dark)', url: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg' },
    bR: { name: 'Championship Rook (Dark)', url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg' },
    bQ: { name: 'Championship Queen (Dark)', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg' },
    bK: { name: 'Championship King (Dark)', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg' }
  }
};

const BOARD_BGS = [
  { id: 'none', name: 'None (Solid Color)', url: '' },
  { id: 'wood', name: 'Oak Wood Table', url: 'https://images.unsplash.com/photo-1546484396-fb3f6af5c0b0?w=800&q=80' },
  { id: 'marble', name: 'Polished Marble', url: 'https://images.unsplash.com/photo-1542880091-865dc606fbf3?w=800&q=80' },
  { id: 'stars', name: 'Galaxy Stars', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80' },
  { id: 'water', name: 'Ocean Waves', url: 'https://images.unsplash.com/photo-1488188840666-e2308741a62f?w=800&q=80' }
];

const BASE_SHAPES: Record<string, string> = {
  wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
};

interface StudioWorkspaceProps {
  profile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
}

export function StudioWorkspace({ profile, onUpdateProfile }: StudioWorkspaceProps) {
  const coins = profile?.coins || 0;
  
  const [sandboxGame, setSandboxGame] = useState(new Chess());
  const [sandboxHistory, setSandboxHistory] = useState<string[]>([]);
  
  const [buildName, setBuildName] = useState('My Custom Chess Set');
  const [lightColor, setLightColor] = useState('#f0d9b5');
  const [darkColor, setDarkColor] = useState('#b58863');
  const [borderColor, setBorderColor] = useState('#4e3629');
  const [boardBg, setBoardBg] = useState(BOARD_BGS[0].url);
  
  const [activeSide, setActiveSide] = useState<'white' | 'black'>('white');
  const [editingPieceKey, setEditingPieceKey] = useState<string>('wP');
  
  const [pieceNames, setPieceNames] = useState<Record<string, string>>({
    wP: 'Pawn', wN: 'Knight', wB: 'Bishop', wR: 'Rook', wQ: 'Queen', wK: 'King',
    bP: 'Pawn', bN: 'Knight', bB: 'Bishop', bR: 'Rook', bQ: 'Queen', bK: 'King'
  });

  const [whitePieceColor, setWhitePieceColor] = useState('#ffffff');
  const [blackPieceColor, setBlackPieceColor] = useState('#000000');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [pieceUrls, setPieceUrls] = useState<Record<string, string>>({
    wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadPiecePreset = (presetName: 'classical' | 'medieval' | 'animals') => {
    const preset = STATIC_PRESET_IMAGES[presetName as string];
    if (preset) {
      const urlsCopy = { ...pieceUrls };
      const namesCopy = { ...pieceNames };
      for (const [key, item] of Object.entries(preset)) {
        urlsCopy[key] = item.url;
        namesCopy[key] = item.name;
      }
      setPieceUrls(urlsCopy);
      setPieceNames(namesCopy);
      
    }
  };

  const handlePieceFileUpload = (e: React.ChangeEvent<HTMLInputElement>, pieceKey: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setPieceUrls(prev => ({ ...prev, [pieceKey]: base64 }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBoardBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setBoardBg(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetSandbox = () => {
    setSandboxGame(new Chess());
    setSandboxHistory([]);
  };

  const makeSandboxMove = (move: any) => {
    try {
      const res = sandboxGame.move(move);
      if (res) {
        setSandboxGame(new Chess(sandboxGame.fen()));
        setSandboxHistory(sandboxGame.history());
        return true;
      }
    } catch {
      // invalid
    }
    return false;
  };

  const liveCustomPieces = useMemo(() => {
    const pieces: Record<string, any> = {};
    for (const [key, url] of Object.entries(pieceUrls)) {
      const name = pieceNames[key] || 'Piece';
      const shapeUrl = BASE_SHAPES[key];
      const isWhite = key.startsWith('w');
      const pieceColor = isWhite ? whitePieceColor : blackPieceColor;
      const blendMode = isWhite ? 'multiply' : 'screen';
      
      const isCustom = url !== BASE_SHAPES[key];
      
      pieces[key] = ({ squareWidth }: { squareWidth: number }) => (
        <div style={{ width: squareWidth, height: squareWidth, padding: '6%', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.6))'
          }}>
            {/* Colored or textured backing */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: isCustom ? `url(${url})` : 'none',
              backgroundColor: pieceColor,
              backgroundSize: 'cover',
              maskImage: `url(${shapeUrl})`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: `url(${shapeUrl})`,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              filter: isCustom && !isWhite ? 'brightness(50%) contrast(120%)' : 'none',
            }} title={name} />

            {/* KEEP ORIGINAL OUTLINES AND DETAILS FOR SOLID COLOR PIECES */}
            {!isCustom && (
              <img 
                src={shapeUrl} 
                alt={name}
                title={name}
                referrerPolicy="no-referrer"
                draggable={false}
                style={{ 
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  mixBlendMode: blendMode,
                  pointerEvents: 'none'
                }} 
              />
            )}

            {/* Visual Side Indicator Badge */}
            <div style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              backgroundColor: isWhite ? '#ffffff' : '#1e293b',
              border: isWhite ? '1.5px solid #1e293b' : '1.5px solid #ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 30,
              pointerEvents: 'none'
            }}>
              <span style={{ 
                color: isWhite ? '#1e293b' : '#ffffff', 
                fontSize: '8px', 
                fontFamily: 'monospace',
                fontWeight: 'bold',
                lineHeight: 1
              }}>
                {isWhite ? 'W' : 'B'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return pieces;
  }, [pieceUrls, pieceNames, whitePieceColor, blackPieceColor]);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleForge = () => {
    const cost = 200;
    if (coins < cost) {
      showToast(`Insufficient coins! Creating a Custom Set costs ${cost} Coins.`);
      return;
    }
    if (!buildName.trim()) {
      showToast('Please specify a unique title for your build.');
      return;
    }

    const compiledPieces: Record<string, any> = {};
    for (const key of Object.keys(pieceUrls)) {
      const isWhite = key.startsWith('w');
      compiledPieces[key] = {
        name: pieceNames[key] || `${key.toUpperCase()} Custom`,
        url: pieceUrls[key],
        textureUrl: useTextureMode ? pieceUrls[key] : undefined,
        color: !useTextureMode ? (isWhite ? whitePieceColor : blackPieceColor) : undefined,
        shapeUrl: BASE_SHAPES[key],
      };
    }

    const newTheme: GeneratedTheme = {
      id: `custom_build_${Math.random().toString(36).substring(7)}`,
      themeName: buildName.trim(),
      light: lightColor,
      dark: darkColor,
      border: borderColor,
      pieces: compiledPieces,
      customBoardImage: boardBg || undefined,
      date: new Date().toLocaleDateString()
    };

    onUpdateProfile({
      ...profile!,
      coins: coins - cost,
      customThemes: [...(profile?.customThemes || []), newTheme],
      activeBoardTheme: newTheme.id
    });
    showToast(`🎉 Successfully created "${newTheme.themeName}"! Saved and equipped!`);
  };

  const handleDeleteTheme = (themeId: string) => {
    const remainingCustom = (profile?.customThemes || []).filter(t => t.id !== themeId);
    const isActive = profile?.activeBoardTheme === themeId;
    onUpdateProfile({
      ...profile!,
      customThemes: remainingCustom,
      activeBoardTheme: isActive ? 'default' : profile?.activeBoardTheme
    });
    setDeleteConfirmId(null);
  };

  const handleEquipTheme = (themeId: string) => {
    onUpdateProfile({
      ...profile!,
      activeBoardTheme: themeId
    });
  };

  const getFullPieceLabel = (key: string) => {
    const isWhite = key.startsWith('w');
    const roleMap: Record<string, string> = { P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook', Q: 'Queen', K: 'King' };
    const roleChar = key.charAt(key.length - 1);
    return `${isWhite ? 'White' : 'Black'} ${roleMap[roleChar] || 'Piece'}`;
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 p-4 md:p-8 flex flex-col pb-24">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg w-full">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-amber-500 to-yellow-400 p-3 rounded-2xl text-white shadow-lg">
            <Palette className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">Design Studio</h1>
            <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider">Ultimate Custom Piece & Board Generator</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-200 px-4 py-2.5 rounded-2xl border border-slate-200">
          <div className="text-right">
            <span className="block text-[10px] text-slate-900/50 font-bold uppercase tracking-wider">Coins Saved</span>
            <span className="text-lg font-extrabold text-yellow-600 font-mono">{coins.toLocaleString()}</span>
          </div>
          <div className="bg-yellow-400/20 p-2 rounded-lg text-yellow-600"><Coins size={18} /></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 w-full flex-grow">
        
        {/* LEFT COLUMN: The Interactive 2D Workspace Sandbox */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <span className="text-xs font-black uppercase tracking-wider text-yellow-600 flex items-center gap-1.5">
                <PlaySquare size={16} /> Live Preview Sandbox
              </span>
              <button onClick={resetSandbox} className="text-xs text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1" title="Reset Board">
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            <div 
              className="w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-xl relative border-4"
              style={{ 
                borderColor: borderColor,
                backgroundImage: boardBg ? `url(${boardBg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 z-0 bg-slate-50"></div>
              <div className="relative z-10 w-full h-full opacity-90 mix-blend-hard-light sm:mix-blend-normal">
                <Chessboard 
                  showBoardNotation={false}
                  position={sandboxGame.fen()}
                  onPieceDrop={(source, target) => makeSandboxMove({ from: source, to: target, promotion: 'q' })}
                  onPieceClick={(piece) => {
                    setEditingPieceKey(piece);
                    setActiveSide(piece.startsWith('w') ? 'white' : 'black');
                  }}
                  onSquareClick={(square) => {
                    const pObj = sandboxGame.get(square);
                    if (pObj) {
                      const pKey = `${pObj.color}${pObj.type.toUpperCase()}`;
                      setEditingPieceKey(pKey);
                      setActiveSide(pObj.color === 'w' ? 'white' : 'black');
                    }
                  }}
                  customPieces={liveCustomPieces}
                  customDarkSquareStyle={{ backgroundColor: darkColor, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)' }}
                  customLightSquareStyle={{ backgroundColor: lightColor, boxShadow: 'inset 0 0 5px rgba(255,255,255,0.05)' }}
                  animationDuration={1}
                  snapToCursor={true}
                />
              </div>
            </div>
            {sandboxHistory.length > 0 && (
              <div className="mt-4 pt-1.5 flex flex-wrap gap-1 items-center bg-slate-100 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-900/50 uppercase font-black">History:</span>
                <span className="text-[10px] font-mono font-bold text-green-600">{sandboxHistory.slice(-5).join(" → ")}</span>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="text-yellow-600" size={14} /> Starter Preset
            </h3>
            <p className="text-xs text-slate-500 mb-4">Start your build instantly with the classic piece preset.</p>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => loadPiecePreset('classical')}
                className="bg-slate-100 hover:bg-blue-600/20 hover:text-blue-600 border border-slate-200 rounded-2xl p-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <span>⭐</span><span>Reset to Pro Classic</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Design Workbench Controller */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-6">
            
            {/* Set Description Title & Colors */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-600 block mb-1">Set Description</span>
                <input 
                  type="text"
                  value={buildName}
                  onChange={e => setBuildName(e.target.value)}
                  placeholder="Set Build Title..."
                  className="w-full bg-slate-200 border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 placeholder-white/30 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Color selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-100 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Light Square</label>
                  <div className="flex items-center gap-2.5 bg-slate-200 border border-slate-200 rounded-2xl p-2">
                    <input 
                      type="color" 
                      value={lightColor} 
                      onChange={e => setLightColor(e.target.value)} 
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0" 
                    />
                    <span className="text-xs font-mono font-bold text-slate-900/85 uppercase">{lightColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dark Square</label>
                  <div className="flex items-center gap-2.5 bg-slate-200 border border-slate-200 rounded-2xl p-2">
                    <input 
                      type="color" 
                      value={darkColor} 
                      onChange={e => setDarkColor(e.target.value)} 
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0" 
                    />
                    <span className="text-xs font-mono font-bold text-slate-900/85 uppercase">{darkColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Frame Borders</label>
                  <div className="flex items-center gap-2.5 bg-slate-200 border border-slate-200 rounded-2xl p-2">
                    <input 
                      type="color" 
                      value={borderColor} 
                      onChange={e => setBorderColor(e.target.value)} 
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0" 
                    />
                    <span className="text-xs font-mono font-bold text-slate-900/85 uppercase">{borderColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                 <ImageIcon size={14}/> Optional Board Background Image
              </span>
              <div className="flex gap-3 items-center mt-2">
                <div className="relative flex-shrink-0 w-32 h-16 rounded-2xl border-2 flex items-center justify-center transition-all bg-slate-200 border-slate-300 hover:border-slate-400 cursor-pointer">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-slate-900/80">
                    <Upload size={16} className="mb-1" />
                    Upload Image
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBoardBgUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Upload Custom Board Background"
                  />
                </div>
                {boardBg && boardBg !== '' && (
                  <button 
                    onClick={() => setBoardBg('')} 
                    className="flex-shrink-0 px-4 h-16 rounded-2xl border-2 border-red-500/20 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors flex flex-col items-center justify-center"
                  >
                    <Trash2 size={16} className="mb-1" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            
            {/* Pieces Design studio */}
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-600">
                  Custom Piece Editor (Select to replace)
                </span>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500">White:</label>
                        <input type="color" value={whitePieceColor} onChange={e => setWhitePieceColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Black:</label>
                        <input type="color" value={blackPieceColor} onChange={e => setBlackPieceColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                      </div>
                    </div>

                  <div className="flex gap-2 border-l border-slate-300 pl-4 ml-2">
                    <button 
                      type="button" 
                      onClick={() => { setActiveSide('white'); setEditingPieceKey('wP'); }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${activeSide === 'white' ? 'bg-[#ebecd0] text-white/50 border border-slate-300' : 'bg-slate-50 text-slate-900/70'}`}
                      style={{ color: activeSide === 'white' ? 'black' : undefined }}
                    >
                      White
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setActiveSide('black'); setEditingPieceKey('bP'); }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${activeSide === 'black' ? 'bg-[#739552] text-white' : 'bg-slate-50 text-slate-900/70'}`}
                    >
                      Black
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of keys for selector */}
              <div className="grid grid-cols-6 gap-2">
                {['P', 'N', 'B', 'R', 'Q', 'K'].map((roleChar) => {
                  const key = `${activeSide === 'white' ? 'w' : 'b'}${roleChar}`;
                  const isEditing = editingPieceKey === key;
                  const label = getFullPieceLabel(key).split(' ')[1];
                  const imgUrl = pieceUrls[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditingPieceKey(key)}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all ${isEditing ? 'bg-yellow-400/20 border-amber-400 scale-[1.02]' : 'bg-slate-100 border-slate-200 hover:border-slate-200'}`}
                    >
                      <div className="w-10 h-10 rounded-lg p-0.5 bg-slate-200 flex items-center justify-center overflow-hidden">
                        <img src={imgUrl} className="w-full h-full object-contain" onError={e => e.currentTarget.style.opacity='0.2'} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-900/80">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active editing workbench card */}
              {editingPieceKey && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-200 rounded-2xl p-1.5 flex items-center justify-center border border-slate-300 flex-shrink-0">
                      <img src={pieceUrls[editingPieceKey]} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{getFullPieceLabel(editingPieceKey)}</h4>
                      <p className="text-[10px] text-slate-500">Design this piece manually via local photo upload or web URL.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 uppercase font-black mb-1.5 flex items-center justify-between">
                         Upload Local Image 
                      </label>
                      <div className="relative w-full bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white text-center py-2 text-xs font-bold cursor-pointer shadow-sm">
                        <Upload size={14} className="inline mr-1" /> Choose File
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handlePieceFileUpload(e, editingPieceKey)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 uppercase font-black mb-1.5">Custom Display Name</label>
                      <input 
                        type="text" 
                        value={pieceNames[editingPieceKey] || ''} 
                        onChange={e => setPieceNames(prev => ({ ...prev, [editingPieceKey]: e.target.value }))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none" 
                        placeholder="e.g Pikachu"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-600 uppercase font-black mb-1 flex justify-between">
                      Paste Image URL (Transparent PNG or Texture)
                    </label>
                    <input 
                      type="text" 
                      value={pieceUrls[editingPieceKey] || ''} 
                      onChange={e => setPieceUrls(prev => ({ ...prev, [editingPieceKey]: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none" 
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {/* Quick Bulk Image Set tool */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 space-y-4 mt-4">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Quick Bulk Image Set</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Speed up creation by applying an image/texture to multiple pieces at once rather than doing them one by one.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Option A: White side */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">White Side Only</span>
                      <p className="text-[9px] text-zinc-400 mt-1 mb-2">Apply image/descriptor URL to all 6 White pieces.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="relative w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-slate-300">
                        📁 Batch Upload
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                if (dataUrl) {
                                  const updated: Record<string, string> = {};
                                  ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK'].forEach(k => { updated[k] = dataUrl; });
                                  setPieceUrls(prev => ({ ...prev, ...updated }));
                                  showToast('⚡ Uploaded image applied to all WHITE pieces!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          id="bulk-white-url"
                          placeholder="Paste White URL..."
                          className="flex-1 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-[10px] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('bulk-white-url') as HTMLInputElement | null;
                            if (input?.value.trim()) {
                              const val = input.value.trim();
                              const updated: Record<string, string> = {};
                              ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK'].forEach(k => { updated[k] = val; });
                              setPieceUrls(prev => ({ ...prev, ...updated }));
                              showToast('⚡ Applied URL to all WHITE pieces!');
                            }
                          }}
                          className="px-2 py-1 bg-slate-900 text-white rounded font-bold text-[10px]"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Option B: Black side */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">Black Side Only</span>
                      <p className="text-[9px] text-zinc-400 mt-1 mb-2">Apply image/descriptor URL to all 6 Black pieces.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="relative w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-slate-300">
                        📁 Batch Upload
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                if (dataUrl) {
                                  const updated: Record<string, string> = {};
                                  ['bP', 'bN', 'bB', 'bR', 'bQ', 'bK'].forEach(k => { updated[k] = dataUrl; });
                                  setPieceUrls(prev => ({ ...prev, ...updated }));
                                  showToast('⚡ Uploaded image applied to all BLACK pieces!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          id="bulk-black-url"
                          placeholder="Paste Black URL..."
                          className="flex-1 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-[10px] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('bulk-black-url') as HTMLInputElement | null;
                            if (input?.value.trim()) {
                              const val = input.value.trim();
                              const updated: Record<string, string> = {};
                              ['bP', 'bN', 'bB', 'bR', 'bQ', 'bK'].forEach(k => { updated[k] = val; });
                              setPieceUrls(prev => ({ ...prev, ...updated }));
                              showToast('⚡ Applied URL to all BLACK pieces!');
                            }
                          }}
                          className="px-2 py-1 bg-slate-900 text-white rounded font-bold text-[10px]"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Option C: Entire Set (All 12) */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between col-span-1 md:col-span-2 lg:col-span-1">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">Entire Set (All 12)</span>
                      <p className="text-[9px] text-zinc-400 mt-1 mb-2">Same image for all. Black pieces are automatically darkened and indicator dots are added!</p>
                    </div>
                    <div className="space-y-2">
                      <div className="relative w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer border border-slate-300">
                        📁 Batch Upload All
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                if (dataUrl) {
                                  const updated: Record<string, string> = {};
                                  const keys = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
                                  keys.forEach(k => { updated[k] = dataUrl; });
                                  setPieceUrls(prev => ({ ...prev, ...updated }));
                                  showToast('⚡ Applied uploaded image to all 12 chess pieces! Black pieces are automatically dimmed.');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          id="bulk-all-url"
                          placeholder="Paste Universal URL..."
                          className="flex-1 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-[10px] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('bulk-all-url') as HTMLInputElement | null;
                            if (input?.value.trim()) {
                              const val = input.value.trim();
                              const updated: Record<string, string> = {};
                              const keys = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
                              keys.forEach(k => { updated[k] = val; });
                              setPieceUrls(prev => ({ ...prev, ...updated }));
                              showToast('⚡ Applied URL to all 12 pieces! Black pieces are automatically dimmed.');
                            }
                          }}
                          className="px-2 py-1 bg-slate-900 text-white rounded font-bold text-[10px]"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-yellow-400/20 text-yellow-600 border border-amber-400/30 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 font-mono">
                  <Coins size={14} /> 200
                </span>
                <span className="text-[11px] text-zinc-400">Save permanently. Equips theme instantly.</span>
              </div>
              <button
                type="button"
                onClick={handleForge}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1"
              >
                <Plus size={18} /> Finish Creation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER SECTION: Constructed Built Custom Chess Sets Inventory */}
      <div className="max-w-7xl mx-auto mt-12 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg w-full">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="bg-blue-600/20 p-2 rounded-2xl text-blue-600">
            <FolderHeart size={22} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Custom Sets Collection</h2>
            <p className="text-xs text-slate-500">Loaded custom sets generated via the Design Studio.</p>
          </div>
        </div>

        {profile?.customThemes && profile.customThemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.customThemes.map((ct) => {
              const activeThemeId = profile?.activeBoardTheme;
              const isEquipped = activeThemeId === ct.id;
              
              return (
                <div 
                  key={ct.id} 
                  className={`bg-white rounded-2xl p-5 border relative flex flex-col hover:border-slate-200 transition-all ${isEquipped ? 'border-blue-600 ring-1 ring-blue-600/20' : 'border-slate-300'}`}
                >
                  <div 
                    className="w-full aspect-video rounded-2xl overflow-hidden mb-4 shadow-inner grid grid-cols-4 grid-rows-2 relative border border-slate-200 mt-2"
                    style={{
                      backgroundImage: ct.customBoardImage ? `url(${ct.customBoardImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {!ct.customBoardImage && (
                       <>
                         <div style={{ backgroundColor: ct.light }}></div><div style={{ backgroundColor: ct.dark }}></div><div style={{ backgroundColor: ct.light }}></div><div style={{ backgroundColor: ct.dark }}></div>
                         <div style={{ backgroundColor: ct.dark }}></div><div style={{ backgroundColor: ct.light }}></div><div style={{ backgroundColor: ct.dark }}></div><div style={{ backgroundColor: ct.light }}></div>
                       </>
                    )}
                    
                    {ct.customBoardImage && <div className="absolute inset-0 bg-slate-50"></div>}

                    {ct.pieces && (
                      <div className="absolute inset-0 flex items-center justify-center gap-4 bg-transparent backdrop-blur-[2px]">
                         {[ct.pieces.wN, ct.pieces.bN].map((p, i) => {
                           if (!p) return null;
                           const isWhite = i === 0;
                           const blendMode = isWhite ? 'multiply' : 'screen';
                           return (
                             <div key={i} className="w-12 h-12 relative" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}>
                                <div style={{
                                  position: 'absolute',
                                  top: 0, left: 0, right: 0, bottom: 0,
                                  backgroundImage: p.textureUrl ? `url(${p.textureUrl})` : 'none',
                                  backgroundColor: p.color || 'transparent',
                                  backgroundSize: 'cover',
                                  maskImage: p.shapeUrl ? `url(${p.shapeUrl})` : 'none',
                                  maskSize: 'contain',
                                  maskRepeat: 'no-repeat',
                                  maskPosition: 'center',
                                  WebkitMaskImage: p.shapeUrl ? `url(${p.shapeUrl})` : 'none',
                                  WebkitMaskSize: 'contain',
                                  WebkitMaskRepeat: 'no-repeat',
                                  WebkitMaskPosition: 'center',
                                }} />
                                {!p.textureUrl && p.color && p.shapeUrl && (
                                  <img 
                                    src={p.shapeUrl} 
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                                    style={{ mixBlendMode: blendMode }}
                                    alt={p.name} 
                                  />
                                )}
                             </div>
                           );
                         })}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-1">{ct.themeName}</h3>
                  <div className="flex gap-2 mb-4">
                     {ct.customBoardImage && <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-zinc-400">Custom BG</span>}
                     <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-zinc-400">Custom Avatars</span>
                  </div>
                  
                  <div className="mt-auto flex gap-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleEquipTheme(ct.id)}
                      disabled={isEquipped}
                      className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-[0_3px_0_rgba(0,0,0,0.15)] ${isEquipped ? 'bg-zinc-850 border border-slate-300 text-zinc-550 cursor-default shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white active:translate-y-0.5'}`}
                    >
                      {isEquipped ? 'Active Fitted' : 'Equip Theme'}
                    </button>
                    <button
                      onClick={() => {
                         if (deleteConfirmId === ct.id) {
                            handleDeleteTheme(ct.id);
                         } else {
                            setDeleteConfirmId(ct.id);
                            setTimeout(() => setDeleteConfirmId(null), 3000);
                         }
                      }}
                      className={`p-2.5 transition-all rounded-2xl ${deleteConfirmId === ct.id ? 'bg-red-500 text-white' : 'bg-red-950/20 hover:bg-red-950/40 border border-red-500/25 text-red-600'}`}
                      title={deleteConfirmId === ct.id ? "Click again to confirm" : "Delete Theme"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-100 p-8 rounded-2xl border border-dashed border-slate-200 text-center max-w-sm mx-auto">
            <Sparkles className="mx-auto mb-3 text-slate-500/30" size={32} />
            <h4 className="text-slate-900 font-bold text-sm mb-1">Vault Empty</h4>
            <p className="text-xs text-slate-500">You haven't generated any Custom Chess Sets yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

