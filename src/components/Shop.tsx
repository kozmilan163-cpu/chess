import React from 'react';
import { UserProfile, GeneratedTheme } from './Profile';
import { ShoppingCart, Check, Coins, Sparkles, Plus, Palette, ChevronDown, ChevronUp, Wrench, Trash2, Info, X, Play, RotateCcw } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export type ThemeDef = {
  id: string;
  name: string;
  cost: number;
  light: string;
  dark: string;
  border?: string;
  pieces?: any;
};

export const THEMES: ThemeDef[] = [
  { id: 'default', name: 'Original Green', cost: 0, light: '#ebecd0', dark: '#739552' },
  { id: 'walnut', name: 'Classic Walnut (Wood)', cost: 500, light: '#f0d9b5', dark: '#b58863' },
  { id: 'sandalwood', name: 'Royal Sandalwood (Wood)', cost: 750, light: '#f4e6d2', dark: '#c49c74', border: '#946c44' },
  { id: 'mahogany', name: 'Vintage Mahogany (Wood)', cost: 1000, light: '#e0c9a6', dark: '#8c4b37', border: '#5c2414' },
  { id: 'ocean_glass', name: 'Frosted Ocean (Glass)', cost: 1250, light: '#e0f2f1', dark: '#26a69a', border: '#004d40' },
  { id: 'midnight_glass', name: 'Midnight Crystal (Glass)', cost: 1500, light: '#eceff1', dark: '#37474f', border: '#263238' },
  { id: 'mint_glass', name: 'Mint Glass (Glass)', cost: 1500, light: '#f1f8e9', dark: '#689f38', border: '#33691e' },
  { id: 'bubblegum', name: 'Bubblegum (Clay)', cost: 1000, light: '#ffcce6', dark: '#e066a3' },
  { id: 'desert', name: 'Desert Dunes (Clay)', cost: 750, light: '#ffecb3', dark: '#a1887f', border: '#5d4037' },
  { id: 'emerald', name: 'Royal Emerald (Jade)', cost: 1750, light: '#c8e6c9', dark: '#2e7d32', border: '#1b5e20' },
  { id: 'crimson', name: 'Crimson Velvet (Fabric)', cost: 2000, light: '#ffcdd2', dark: '#c62828', border: '#7f0000' },
  { id: 'marble', name: 'Icelandic Marble (Stone)', cost: 2250, light: '#fafafa', dark: '#212121', border: '#000000' },
  { id: 'neon', name: 'Cyber Neon (Tech Glass)', cost: 2500, light: '#222222', dark: '#00e5ff' }
];

export const PIECE_PRESETS: Record<string, { name: string, items: Record<string, { name: string, url: string }> }> = {
  medieval: {
    name: "👑 Royal Kingdom (Icons8 Vectors)",
    items: {
      wP: { name: 'Squire Sword', url: 'https://img.icons8.com/color/96/sword.png' },
      wN: { name: 'White Knight', url: 'https://img.icons8.com/color/96/knight.png' },
      wB: { name: 'Paladin Shield', url: 'https://img.icons8.com/color/96/shield.png' },
      wR: { name: 'White Keep', url: 'https://img.icons8.com/color/96/castle.png' },
      wQ: { name: 'White Queen', url: 'https://img.icons8.com/color/96/queen.png' },
      wK: { name: 'White King', url: 'https://img.icons8.com/color/96/king.png' },
      bP: { name: 'Vanguard Bow', url: 'https://img.icons8.com/color/96/archers-bow.png' },
      bN: { name: 'Black Knight', url: 'https://img.icons8.com/color/96/helmet.png' },
      bB: { name: 'Dark Sorcerer', url: 'https://img.icons8.com/color/96/wizard.png' },
      bR: { name: 'Dark Spire', url: 'https://img.icons8.com/color/96/tower.png' },
      bQ: { name: 'Dark Queen', url: 'https://img.icons8.com/color/96/dark-queen.png' },
      bK: { name: 'Dark Overlord', url: 'https://img.icons8.com/color/96/crown.png' }
    }
  },
  animals: {
    name: "🐾 Cute Pocket Pets (Transparent Art)",
    items: {
      wP: { name: 'Pawn (Eevee)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
      wN: { name: 'Knight (Pikachu)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
      wB: { name: 'Bishop (Togepi)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/175.png' },
      wR: { name: 'Rook (Blastoise)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png' },
      wQ: { name: 'Queen (Ninetales)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/38.png' },
      wK: { name: 'King (Charizard)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },
      bP: { name: 'Pawn (Meowth)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/52.png' },
      bN: { name: 'Knight (Arcanine)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/59.png' },
      bB: { name: 'Bishop (Gengar)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png' },
      bR: { name: 'Rook (Snorlax)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png' },
      bQ: { name: 'Queen (Mewtwo)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png' },
      bK: { name: 'King (Mew)', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png' }
    }
  }
};

interface ShopProps {
  profile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onNavigateToTab?: (tab: 'play' | 'social' | 'profile' | 'shop' | 'studio') => void;
}

export function Shop({ profile, onUpdateProfile, onNavigateToTab }: ShopProps) {
  const coins = profile?.coins || 0;
  const inventory = profile?.inventory || ['default'];
  const activeTheme = profile?.activeBoardTheme || 'default';

  // Modal selector for theme and piece preview states
  const [previewTheme, setPreviewTheme] = React.useState<any | null>(null);

  // Interactive preview game state
  const [previewGame, setPreviewGame] = React.useState<Chess | null>(null);
  const [previewGameFen, setPreviewGameFen] = React.useState('start');

  React.useEffect(() => {
    if (previewTheme) {
      const g = new Chess();
      setPreviewGame(g);
      setPreviewGameFen(g.fen());
    } else {
      setPreviewGame(null);
      setPreviewGameFen('start');
    }
  }, [previewTheme]);

  const previewCustomPieces = React.useMemo(() => {
    if (!previewTheme) return undefined;
    
    // Pieces can come from previewTheme (which matches theme structure)
    if (previewTheme.pieces) {
      const pieces: Record<string, any> = {};
      for (const [pieceStr, data] of Object.entries(previewTheme.pieces)) {
        if (!data || !(data as any).url) continue;
        const pieceData = data as { name: string, url: string, textureUrl?: string, shapeUrl?: string, color?: string };
        pieces[pieceStr] = ({ squareWidth }: { squareWidth: number }) => {
          const isWhite = pieceStr.startsWith('w');
          if (pieceData.shapeUrl && (pieceData.textureUrl || pieceData.color)) {
            const blendMode = isWhite ? 'multiply' : 'screen';
            return (
              <div style={{ width: squareWidth, height: squareWidth, padding: '5%', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    backgroundImage: pieceData.textureUrl ? `url(${pieceData.textureUrl})` : 'none',
                    backgroundColor: pieceData.color || 'transparent',
                    backgroundSize: 'cover',
                    maskImage: `url(${pieceData.shapeUrl})`,
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: `url(${pieceData.shapeUrl})`,
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    filter: pieceData.textureUrl && !isWhite ? 'brightness(50%) contrast(120%)' : 'none',
                  }} />

                  {/* Keep authentic features/lines on solid colors */}
                  {!pieceData.textureUrl && pieceData.color && (
                    <img 
                      src={pieceData.shapeUrl} 
                      alt={pieceData.name} 
                      title={pieceData.name}
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
                    bottom: '-1px',
                    right: '-1px',
                    width: '12px',
                    height: '12px',
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
                      fontSize: '7px', 
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
          // Default to simple URL image if not textured/colored shape
          return (
            <div style={{ width: squareWidth, height: squareWidth, padding: '5%', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <img 
                  src={pieceData.url} 
                  alt={pieceData.name} 
                  referrerPolicy="no-referrer"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    filter: `drop-shadow(1px 1px 2px rgba(0,0,0,0.6)) ${!isWhite ? 'brightness(50%) contrast(120%)' : ''}`
                  }} 
                />

                {/* Visual Side Indicator Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '12px',
                  height: '12px',
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
                    fontSize: '7px', 
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
        };
      }
      return pieces;
    }
    return undefined;
  }, [previewTheme]);

  const onPreviewDrop = (sourceSquare: string, targetSquare: string) => {
    if (!previewGame) return false;
    try {
      const move = previewGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // auto promote to queen for simplicity
      });
      if (move === null) return false;
      setPreviewGameFen(previewGame.fen());
      return true;
    } catch (e) {
      return false;
    }
  };

  const makeRandomMove = () => {
    if (!previewGame || previewGame.isGameOver()) return;
    const moves = previewGame.moves();
    if (moves.length === 0) return;
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    previewGame.move(randomMove);
    setPreviewGameFen(previewGame.fen());
  };

  // State variables for Custom Theme Forge
  const [customBuildName, setCustomBuildName] = React.useState('My Custom Build');
  const [customLight, setCustomLight] = React.useState('#e2dbbe');
  const [customDark, setCustomDark] = React.useState('#627d41');
  const [customBorder, setCustomBorder] = React.useState('#41552a');
  const [presetType, setPresetType] = React.useState<'medieval' | 'animals' | 'standard'>('medieval');
  const [showManualPieces, setShowManualPieces] = React.useState(false);

  // White pieces configuration
  const [whitePawnUrl, setWhitePawnUrl] = React.useState('https://img.icons8.com/color/96/sword.png');
  const [whiteKnightUrl, setWhiteKnightUrl] = React.useState('https://img.icons8.com/color/96/knight.png');
  const [whiteBishopUrl, setWhiteBishopUrl] = React.useState('https://img.icons8.com/color/96/shield.png');
  const [whiteRookUrl, setWhiteRookUrl] = React.useState('https://img.icons8.com/color/96/castle.png');
  const [whiteQueenUrl, setWhiteQueenUrl] = React.useState('https://img.icons8.com/color/96/queen.png');
  const [whiteKingUrl, setWhiteKingUrl] = React.useState('https://img.icons8.com/color/96/king.png');
  
  // Black pieces configuration
  const [blackPawnUrl, setBlackPawnUrl] = React.useState('https://img.icons8.com/color/96/archers-bow.png');
  const [blackKnightUrl, setBlackKnightUrl] = React.useState('https://img.icons8.com/color/96/helmet.png');
  const [blackBishopUrl, setBlackBishopUrl] = React.useState('https://img.icons8.com/color/96/wizard.png');
  const [blackRookUrl, setBlackRookUrl] = React.useState('https://img.icons8.com/color/96/tower.png');
  const [blackQueenUrl, setBlackQueenUrl] = React.useState('https://img.icons8.com/color/96/dark-queen.png');
  const [blackKingUrl, setBlackKingUrl] = React.useState('https://img.icons8.com/color/96/crown.png');

  // Human-readable identifiers
  const [whitePawnName, setWhitePawnName] = React.useState('Squire Sword');
  const [whiteKnightName, setWhiteKnightName] = React.useState('White Knight');
  const [whiteBishopName, setWhiteBishopName] = React.useState('Paladin Shield');
  const [whiteRookName, setWhiteRookName] = React.useState('White Keep');
  const [whiteQueenName, setWhiteQueenName] = React.useState('White Queen');
  const [whiteKingName, setWhiteKingName] = React.useState('White King');
  
  const [blackPawnName, setBlackPawnName] = React.useState('Vanguard Bow');
  const [blackKnightName, setBlackKnightName] = React.useState('Black Knight');
  const [blackBishopName, setBlackBishopName] = React.useState('Dark Sorcerer');
  const [blackRookName, setBlackRookName] = React.useState('Dark Spire');
  const [blackQueenName, setBlackQueenName] = React.useState('Dark Queen');
  const [blackKingName, setBlackKingName] = React.useState('Dark Overlord');
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handlePresetChange = (type: 'medieval' | 'animals' | 'standard') => {
    setPresetType(type);
    if (type === 'standard') {
      // Standard has no special pieces
    } else {
      const preset = PIECE_PRESETS[type as string];
      if (preset && preset.items) {
        setWhitePawnUrl(preset.items.wP.url);
        setWhiteKnightUrl(preset.items.wN.url);
        setWhiteBishopUrl(preset.items.wB.url);
        setWhiteRookUrl(preset.items.wR.url);
        setWhiteQueenUrl(preset.items.wQ.url);
        setWhiteKingUrl(preset.items.wK.url);
        
        setBlackPawnUrl(preset.items.bP.url);
        setBlackKnightUrl(preset.items.bN.url);
        setBlackBishopUrl(preset.items.bB.url);
        setBlackRookUrl(preset.items.bR.url);
        setBlackQueenUrl(preset.items.bQ.url);
        setBlackKingUrl(preset.items.bK.url);

        setWhitePawnName(preset.items.wP.name);
        setWhiteKnightName(preset.items.wN.name);
        setWhiteBishopName(preset.items.wB.name);
        setWhiteRookName(preset.items.wR.name);
        setWhiteQueenName(preset.items.wQ.name);
        setWhiteKingName(preset.items.wK.name);

        setBlackPawnName(preset.items.bP.name);
        setBlackKnightName(preset.items.bN.name);
        setBlackBishopName(preset.items.bB.name);
        setBlackRookName(preset.items.bR.name);
        setBlackQueenName(preset.items.bQ.name);
        setBlackKingName(preset.items.bK.name);
      }
    }
  };

  const handleForgeCustomBuild = () => {
    const cost = 200;
    if (coins < cost) {
      showToast("You need 200 coins to forge a custom build.");
      return;
    }
    if (!profile) return;

    let piecesObj: Record<string, { name: string, url: string }> | undefined = undefined;
    if (presetType !== 'standard') {
      piecesObj = {
        wP: { name: whitePawnName, url: whitePawnUrl },
        wN: { name: whiteKnightName, url: whiteKnightUrl },
        wB: { name: whiteBishopName, url: whiteBishopUrl },
        wR: { name: whiteRookName, url: whiteRookUrl },
        wQ: { name: whiteQueenName, url: whiteQueenUrl },
        wK: { name: whiteKingName, url: whiteKingUrl },
        bP: { name: blackPawnName, url: blackPawnUrl },
        bN: { name: blackKnightName, url: blackKnightUrl },
        bB: { name: blackBishopName, url: blackBishopUrl },
        bR: { name: blackRookName, url: blackRookUrl },
        bQ: { name: blackQueenName, url: blackQueenUrl },
        bK: { name: blackKingName, url: blackKingUrl }
      };
    }

    const newTheme: GeneratedTheme = {
      id: `custom_build_${Math.random().toString(36).substring(7)}`,
      themeName: customBuildName.trim() || 'My Crafted Build',
      light: customLight,
      dark: customDark,
      border: customBorder,
      pieces: piecesObj
    };

    onUpdateProfile({
      ...profile,
      coins: coins - cost,
      customThemes: [...(profile.customThemes || []), newTheme],
      activeBoardTheme: newTheme.id
    });

    showToast(`🎉 Successfully forged "${newTheme.themeName}"! It has been added to your collection and active-equipped.`);
  };
  
  const handleBuy = (cost: number, themeId: string) => {
    if (coins >= cost && profile) {
      onUpdateProfile({
        ...profile,
        coins: coins - cost,
        inventory: [...inventory, themeId],
        activeBoardTheme: themeId,
      });
    }
  };

  const handleEquip = (themeId: string) => {
    if (profile) {
      onUpdateProfile({
        ...profile,
        activeBoardTheme: themeId,
      });
    }
  };

  const buyCoins = (amount: number) => {
    if (profile) {
      onUpdateProfile({
        ...profile,
        coins: coins + amount
      });
      // Added mock notification
      showToast(`Successfully purchased ${amount} coins!`);
    }
  };

  return (
    <div className="min-h-full p-4 md:p-8 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Info size={18} className="text-blue-400" />
          {toastMsg}
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={32} />
            Item Shop
          </h1>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2 font-bold text-lg shadow-lg">
            <Coins className="text-yellow-600" />
            <span className="text-slate-900">{coins}</span>
          </div>
        </div>

        {/* Shop Items Section */}

         <h2 className="text-2xl font-bold text-slate-900 mb-6">Themes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEMES.map((theme) => {
            const isOwned = inventory.includes(theme.id) || theme.cost === 0;
            const isEquipped = activeTheme === theme.id;
            const canAfford = coins >= theme.cost;
            
            // Derive theme tags based on price category and assets
            const hasPieces = !!theme.pieces;
            let themeRarity = "COMMON";
            let tagColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
            if (theme.cost >= 5000) {
              themeRarity = "LEGENDARY";
              tagColor = "bg-yellow-500/20 text-amber-300 border-amber-500/30";
            } else if (theme.cost >= 2500) {
              themeRarity = "EPIC";
              tagColor = "bg-purple-500/20 text-purple-300 border-purple-500/30";
            } else if (theme.cost >= 500) {
              themeRarity = "RARE";
              tagColor = "bg-blue-500/20 text-blue-300 border-blue-500/30";
            } else if (hasPieces) {
              themeRarity = "SPECIAL Edition";
              tagColor = "bg-green-50 text-emerald-300 border-green-200";
            }

            return (
              <div 
                key={theme.id} 
                className={`bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl relative flex flex-col group ${isEquipped ? 'border-blue-600 shadow-[0_0_15px_rgba(129,182,76,0.15)] scale-[1.01]' : 'border-slate-200 hover:border-slate-200'}`}
              >
                {/* Rarity & Spec Badge */}
                <div className="absolute top-3 left-3 z-10 flex gap-2">
                  <span className={`text-[9px] tracking-widest uppercase font-extrabold px-2 py-0.5 rounded-full border ${tagColor}`}>
                    {themeRarity}
                  </span>
                </div>

                {hasPieces && theme.pieces && (
                   <div className="absolute top-2 right-2 z-10 flex gap-0.5 bg-slate-300 px-1.5 py-0.5 rounded-lg border border-slate-200 backdrop-blur-md">
                     {Object.entries(theme.pieces).slice(0, 4).map(([k, p]: any) => (
                       <img key={k} src={p.url} alt={p.name} title={p.name} className="w-5 h-5 object-contain" onError={e=>e.currentTarget.style.display='none'} />
                     ))}
                   </div>
                )}

                <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 shadow-inner grid grid-cols-2 grid-rows-2 relative group-hover:scale-[1.02] transition-transform duration-300">
                  <div style={{ backgroundColor: theme.light, boxShadow: theme.border ? `inset 0 0 10px ${theme.border}` : 'none' }}></div>
                  <div style={{ backgroundColor: theme.dark, boxShadow: theme.border ? `inset 0 0 10px ${theme.border}` : 'none' }}></div>
                  <div style={{ backgroundColor: theme.dark, boxShadow: theme.border ? `inset 0 0 10px ${theme.border}` : 'none' }}></div>
                  <div style={{ backgroundColor: theme.light, boxShadow: theme.border ? `inset 0 0 10px ${theme.border}` : 'none' }}></div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{theme.name}</h3>
                
                <div className="flex-1"></div>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    {!isOwned && (
                      <div className="flex items-center gap-1.5 font-bold text-yellow-600">
                        <Coins size={14} className="text-yellow-600" /> 
                        <span className="font-mono text-xs">{theme.cost} Coins</span>
                      </div>
                    )}
                    {isOwned && !isEquipped && (
                      <span className="text-zinc-500 font-medium">Owned</span>
                    )}
                    {isEquipped && (
                      <span className="text-blue-600 font-bold flex items-center gap-1">
                        <Check size={14} /> Active Board
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTheme(theme)}
                      className="py-2.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      👁️ Preview
                    </button>

                    {!isOwned ? (
                      <button
                         type="button"
                         onClick={() => handleBuy(theme.cost, theme.id)}
                         disabled={!canAfford}
                         className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                           canAfford 
                             ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_2px_0_rgba(0,0,0,0.2)] active:translate-y-0.5 cursor-pointer' 
                             : 'bg-slate-100 text-white/20 cursor-not-allowed'
                         }`}
                       >
                         Buy Set
                       </button>
                    ) : !isEquipped ? (
                      <button
                         type="button"
                         onClick={() => handleEquip(theme.id)}
                         className="py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-[0_2px_0_rgba(0,0,0,0.2)] cursor-pointer"
                      >
                         Equip
                      </button>
                    ) : (
                      <div className="flex items-center justify-center text-[10px] text-blue-600 font-black uppercase bg-blue-600/10 rounded-lg py-2">
                        Equipped
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Chess Set Studio Promo Banner */}
        <div className="mt-12 bg-gradient-to-br from-slate-100 via-white to-slate-50 rounded-2xl p-6 md:p-10 border border-blue-600/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
           
           <div className="flex-1 space-y-4">
             <div className="flex items-center gap-3">
               <div className="bg-blue-600/10 p-2.5 rounded-2xl text-blue-600">
                 <Wrench size={30} className="animate-pulse" />
               </div>
               <div>
                 <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest bg-blue-600/10 px-2.5 py-1 rounded-full border border-blue-600/20">Workshop</span>
                 <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">Custom Chess Set Designer</h2>
               </div>
             </div>
             <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-xl">
               Step up your representation. Do not settle for basic configurations—enter the specialized **Custom Chess Set Studio** to choose your own chessboard board colors, configure custom piece avatars, and mint fully working customized chess sets with live interactive board previews.
             </p>
             <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
               <Sparkles size={14} className="text-blue-600" /> Professional tools include: custom board colors, custom piece image uploads, templates, and a dynamic sandbox tester.
             </div>
           </div>
           
           <div className="flex flex-col items-center gap-3 w-full md:w-auto shrink-0 bg-slate-200 p-6 rounded-2xl border border-slate-200 backdrop-blur-sm">
             <div className="text-center">
               <span className="text-xs text-slate-500 font-bold block mb-1">Creation Cost</span>
               <div className="bg-yellow-500/10 border border-yellow-200 px-3 py-1.5 rounded-2xl font-extrabold text-yellow-600 flex items-center justify-center gap-1.5 inline-flex text-lg">
                 <Coins size={18} /> 2,500
               </div>
             </div>
             <button
               type="button"
               onClick={() => {
                 if (onNavigateToTab) {
                   onNavigateToTab('studio');
                 } else {
                   showToast("Please select the 'Custom Chess Set' tab from the navigation bar to access the designer!");
                 }
               }}
               className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-[0_4px_0_rgba(129,182,76,0.25)] hover:shadow-none active:translate-y-1 hover:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
             >
               <Wrench size={16} /> Enter Custom Chess Set Studio
             </button>
           </div>
        </div>

        {/* Hidden Form Block */}
        <div className="hidden">
           <div className="space-y-6">
             {/* Row 1: Name and Board Colors */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 p-5 rounded-2xl border border-slate-200">
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Theme Build Name</label>
                   <input 
                     type="text"
                     value={customBuildName}
                     onChange={e => setCustomBuildName(e.target.value)}
                     placeholder="e.g., Space Marines, Neon Knight"
                     className="w-full bg-slate-200 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                   />
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-mono mb-1">Light Cells</label>
                      <div className="flex items-center gap-2 bg-slate-200 border border-slate-200 rounded-lg p-1">
                        <input type="color" value={customLight} onChange={e => setCustomLight(e.target.value)} className="w-8 h-8 rounded-md border-0 bg-transparent cursor-pointer" />
                        <span className="text-[10px] font-mono text-slate-900/70 uppercase select-none">{customLight}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-mono mb-1">Dark Cells</label>
                      <div className="flex items-center gap-2 bg-slate-200 border border-slate-200 rounded-lg p-1">
                        <input type="color" value={customDark} onChange={e => setCustomDark(e.target.value)} className="w-8 h-8 rounded-md border-0 bg-transparent cursor-pointer" />
                        <span className="text-[10px] font-mono text-slate-900/70 uppercase select-none">{customDark}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-mono mb-1">Border</label>
                      <div className="flex items-center gap-2 bg-slate-200 border border-slate-200 rounded-lg p-1">
                        <input type="color" value={customBorder} onChange={e => setCustomBorder(e.target.value)} className="w-8 h-8 rounded-md border-0 bg-transparent cursor-pointer" />
                        <span className="text-[10px] font-mono text-slate-900/70 uppercase select-none">{customBorder}</span>
                      </div>
                    </div>
                 </div>
               </div>

               <div className="flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Live Theme Board Preview</span>
                  <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg grid grid-cols-4 grid-rows-2 border border-slate-200 max-h-32">
                    <div style={{ backgroundColor: customLight }}></div>
                    <div style={{ backgroundColor: customDark }}></div>
                    <div style={{ backgroundColor: customLight }}></div>
                    <div style={{ backgroundColor: customDark }}></div>
                    <div style={{ backgroundColor: customDark }}></div>
                    <div style={{ backgroundColor: customLight }}></div>
                    <div style={{ backgroundColor: customDark }}></div>
                    <div style={{ backgroundColor: customLight }}></div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <Info size={12} className="text-blue-600" /> Match squares will render in this grid pattern.
                  </div>
               </div>
             </div>

             {/* Row 2: Piece Theme Blueprint */}
             <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Piece Art Template Pack</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetChange('medieval')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${presetType === 'medieval' ? 'bg-yellow-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-100 text-slate-900/60 hover:text-slate-900 border border-slate-200'}`}
                    >
                      👑 Royal Kingdom
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange('animals')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${presetType === 'animals' ? 'bg-yellow-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-100 text-slate-900/60 hover:text-slate-900 border border-slate-200'}`}
                    >
                      🐾 Cute Companions
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange('standard')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${presetType === 'standard' ? 'bg-yellow-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-100 text-slate-900/60 hover:text-slate-900 border border-slate-200'}`}
                    >
                      ♟️ Wood Classic
                    </button>
                  </div>
                </div>

                {presetType !== 'standard' && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                     <div className="flex justify-between items-center mb-3">
                       <span className="text-xs font-bold text-slate-500 uppercase">Custom Sprites Mappings</span>
                       <button
                         type="button"
                         onClick={() => setShowManualPieces(!showManualPieces)}
                         className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                       >
                         {showManualPieces ? 'Hide Manual Inputs' : 'Manual Overrides (URLs & Names)'}
                       </button>
                     </div>

                     {/* Display live piece avatars */}
                     <div className="flex flex-wrap gap-3 bg-slate-100 p-3 rounded-lg border border-slate-200 items-center justify-center">
                        <div className="text-[10px] uppercase font-bold text-slate-900/30 mr-2">Preview:</div>
                        <div className="flex gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 overflow-x-auto">
                           <img src={whitePawnUrl} title={whitePawnName} className="w-8 h-8 object-contain" />
                           <img src={whiteKnightUrl} title={whiteKnightName} className="w-8 h-8 object-contain" />
                           <img src={whiteBishopUrl} title={whiteBishopName} className="w-8 h-8 object-contain" />
                           <img src={whiteRookUrl} title={whiteRookName} className="w-8 h-8 object-contain" />
                           <img src={whiteQueenUrl} title={whiteQueenName} className="w-8 h-8 object-contain" />
                           <img src={whiteKingUrl} title={whiteKingName} className="w-8 h-8 object-contain" />
                        </div>
                        <div className="text-slate-900/40 text-xs">VS</div>
                        <div className="flex gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 overflow-x-auto">
                           <img src={blackPawnUrl} title={blackPawnName} className="w-8 h-8 object-contain" />
                           <img src={blackKnightUrl} title={blackKnightName} className="w-8 h-8 object-contain" />
                           <img src={blackBishopUrl} title={blackBishopName} className="w-8 h-8 object-contain" />
                           <img src={blackRookUrl} title={blackRookName} className="w-8 h-8 object-contain" />
                           <img src={blackQueenUrl} title={blackQueenName} className="w-8 h-8 object-contain" />
                           <img src={blackKingUrl} title={blackKingName} className="w-8 h-8 object-contain" />
                        </div>
                     </div>

                     {/* Bulk set option */}
                     <div className="mt-3 p-3 bg-slate-200 rounded-lg border border-slate-300 space-y-2 text-left">
                       <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                         <Sparkles size={12} className="text-amber-500" />
                         <span>📦 Quick Bulk Image Set (Entire Set)</span>
                       </div>
                       <p className="text-[10px] text-slate-500 leading-tight">Paste an image URL to apply to all 12 white and black pieces at once, or choose a file from your computer.</p>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                         <div className="relative w-full bg-white hover:bg-slate-50 border border-slate-300 transition-colors rounded-lg text-slate-850 text-center py-2 text-xs font-bold cursor-pointer">
                           📁 Choose File for Entire Set
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
                                     setWhitePawnUrl(dataUrl);
                                     setWhiteKnightUrl(dataUrl);
                                     setWhiteBishopUrl(dataUrl);
                                     setWhiteRookUrl(dataUrl);
                                     setWhiteQueenUrl(dataUrl);
                                     setWhiteKingUrl(dataUrl);
                                     setBlackPawnUrl(dataUrl);
                                     setBlackKnightUrl(dataUrl);
                                     setBlackBishopUrl(dataUrl);
                                     setBlackRookUrl(dataUrl);
                                     setBlackQueenUrl(dataUrl);
                                     setBlackKingUrl(dataUrl);
                                     showToast('🚀 Applied uploaded file to all 12 chess pieces!');
                                   }
                                 };
                                 reader.readAsDataURL(file);
                               }
                             }}
                             className="absolute inset-0 opacity-0 cursor-pointer"
                           />
                         </div>

                         <div className="flex gap-2">
                           <input 
                             type="text" 
                             id="shop-bulk-url-input"
                             placeholder="Paste URL for all..."
                             className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                           />
                           <button
                             type="button"
                             onClick={() => {
                               const input = document.getElementById('shop-bulk-url-input') as HTMLInputElement | null;
                               if (input && input.value.trim()) {
                                 const val = input.value.trim();
                                 setWhitePawnUrl(val);
                                 setWhiteKnightUrl(val);
                                 setWhiteBishopUrl(val);
                                 setWhiteRookUrl(val);
                                 setWhiteQueenUrl(val);
                                 setWhiteKingUrl(val);
                                 setBlackPawnUrl(val);
                                 setBlackKnightUrl(val);
                                 setBlackBishopUrl(val);
                                 setBlackRookUrl(val);
                                 setBlackQueenUrl(val);
                                 setBlackKingUrl(val);
                                 showToast('🚀 Applied URL to all 12 chess pieces!');
                               } else {
                                 showToast('Please enter a valid URL first.');
                               }
                             }}
                             className="px-3 bg-zinc-800 text-white font-bold text-xs rounded-lg hover:bg-zinc-700 transition"
                           >
                             Apply
                           </button>
                         </div>
                       </div>
                     </div>

                     {/* Manual adjustments */}
                     {showManualPieces && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-slate-200 rounded-lg border border-slate-200 max-h-80 overflow-y-auto">
                         {/* White side */}
                         <div className="space-y-3">
                            <h5 className="text-xs font-bold text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-1.5">🪶 White Piece Customization</h5>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Pawn (wp)</label>
                               <div className="flex gap-2"><input type="text" value={whitePawnName} onChange={e=>setWhitePawnName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={whitePawnUrl} onChange={e=>setWhitePawnUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Knight (wn)</label>
                               <div className="flex gap-2"><input type="text" value={whiteKnightName} onChange={e=>setWhiteKnightName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={whiteKnightUrl} onChange={e=>setWhiteKnightUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Bishop (wb)</label>
                               <div className="flex gap-2"><input type="text" value={whiteBishopName} onChange={e=>setWhiteBishopName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={whiteBishopUrl} onChange={e=>setWhiteBishopUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Rook (wr)</label>
                               <div className="flex gap-2"><input type="text" value={whiteRookName} onChange={e=>setWhiteRookName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={whiteRookUrl} onChange={e=>setWhiteRookUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Queen (wq)</label>
                               <div className="flex gap-2"><input type="text" value={whiteQueenName} onChange={e=>setWhiteQueenName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={whiteQueenUrl} onChange={e=>setWhiteQueenUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">King (wk)</label>
                               <div className="flex gap-2"><input type="text" value={whiteKingName} onChange={e=>setWhiteKingName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={whiteKingUrl} onChange={e=>setWhiteKingUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                         </div>
                         
                         {/* Black side */}
                         <div className="space-y-3">
                            <h5 className="text-xs font-bold text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-1.5">🐈 Black Piece Customization</h5>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Pawn (bp)</label>
                               <div className="flex gap-2"><input type="text" value={blackPawnName} onChange={e=>setBlackPawnName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={blackPawnUrl} onChange={e=>setBlackPawnUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Knight (bn)</label>
                               <div className="flex gap-2"><input type="text" value={blackKnightName} onChange={e=>setBlackKnightName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={blackKnightUrl} onChange={e=>setBlackKnightUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Bishop (bb)</label>
                               <div className="flex gap-2"><input type="text" value={blackBishopName} onChange={e=>setBlackBishopName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={blackBishopUrl} onChange={e=>setBlackBishopUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Rook (br)</label>
                               <div className="flex gap-2"><input type="text" value={blackRookName} onChange={e=>setBlackRookName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={blackRookUrl} onChange={e=>setBlackRookUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">Queen (bq)</label>
                               <div className="flex gap-2"><input type="text" value={blackQueenName} onChange={e=>setBlackQueenName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={blackQueenUrl} onChange={e=>setBlackQueenUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 font-bold block mb-1">King (bk)</label>
                               <div className="flex gap-2"><input type="text" value={blackKingName} onChange={e=>setBlackKingName(e.target.value)} className="w-1/3 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /><input type="text" value={blackKingUrl} onChange={e=>setBlackKingUrl(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 text-slate-900" /></div>
                            </div>
                         </div>
                       </div>
                     )}
                  </div>
                )}
             </div>
           </div>

           {/* Cost & action */}
           <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900 text-sm">Forge Build Cost:</span>
                <span className="bg-yellow-500/15 border border-amber-500/40 px-3 py-1.5 rounded-2xl font-extrabold text-yellow-600 flex items-center gap-1.5">
                  <Coins size={16} /> 2,500
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleForgeCustomBuild}
                className={`w-full md:w-auto px-6 py-3 rounded-2xl font-bold transition-all shadow-[0_4px_0_rgba(0,0,0,0.25)] flex items-center justify-center gap-2 ${coins >= 2500 ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:translate-y-1' : 'bg-slate-100 text-white/30 cursor-not-allowed'}`}
                disabled={coins < 2500}
              >
                <Plus size={18} /> Forge & Create Theme
              </button>
           </div>
        </div>

        {/* Display Constructed Theme inventory items if any exist */}
        {profile?.customThemes && profile.customThemes.length > 0 && (
          <div className="mt-12 border-t border-slate-200 pt-8">
             <div className="flex items-center gap-2 mb-6">
               <Wrench className="text-blue-600" size={24} />
               <h3 className="text-2xl font-bold text-slate-900">Your Custom Sets Pack</h3>
               <span className="bg-blue-600/25 border border-blue-600/40 text-xs px-2 py-1 rounded-md text-blue-600 font-bold">
                 {profile.customThemes.length} Theme{profile.customThemes.length > 1 ? 's' : ''}
               </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.customThemes.map((ct) => {
                  const isCurrent = activeTheme === ct.id;
                  return (
                     <div 
                        key={ct.id} 
                        className={`bg-white rounded-2xl p-5 border relative flex flex-col group ${isCurrent ? 'border-blue-600 shadow-lg' : 'border-slate-200'}`}
                     >
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] tracking-wide font-bold uppercase rounded-full px-2 py-0.5">
                            Custom Build
                          </span>
                        </div>

                        {ct.pieces && (
                          <div className="absolute top-2 right-2 flex gap-0.5 bg-slate-300 px-1.5 py-0.5 rounded-lg border border-slate-200 backdrop-blur-md">
                            {Object.entries(ct.pieces).slice(0, 4).map(([k, p]: any) => (
                              <img key={k} src={p.url} alt={p.name} title={p.name} className="w-5 h-5 object-contain" onError={e=>e.currentTarget.style.display='none'} />
                            ))}
                          </div>
                        )}

                        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 shadow-inner grid grid-cols-2 grid-rows-2">
                           <div style={{ backgroundColor: ct.light }}></div>
                           <div style={{ backgroundColor: ct.dark }}></div>
                           <div style={{ backgroundColor: ct.dark }}></div>
                           <div style={{ backgroundColor: ct.light }}></div>
                        </div>

                        <h4 className="font-bold text-slate-900 text-lg mb-1">{ct.themeName}</h4>
                        <p className="text-xs text-slate-500 mb-4">Colorway Custom Build</p>
                        
                        <div className="flex-grow"></div>
                        
                        <div className="flex gap-2">
                           <button
                              onClick={() => handleEquip(ct.id)}
                              className={`flex-grow py-2 rounded-2xl text-xs font-bold transition-all ${isCurrent ? 'bg-slate-100 text-slate-900/40 cursor-default border border-slate-200' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                              disabled={isCurrent}
                           >
                              {isCurrent ? 'Equipped' : 'Equip Build'}
                           </button>
                           
                           <button
                              onClick={() => {
                                 if (deleteConfirmId === ct.id) {
                                    const filtered = (profile.customThemes || []).filter(item => item.id !== ct.id);
                                    onUpdateProfile({
                                       ...profile,
                                       customThemes: filtered,
                                       activeBoardTheme: isCurrent ? 'default' : profile.activeBoardTheme
                                    });
                                    setDeleteConfirmId(null);
                                 } else {
                                    setDeleteConfirmId(ct.id);
                                    setTimeout(() => setDeleteConfirmId(null), 3000);
                                 }
                              }}
                              className={`p-2 transition-all rounded-2xl ${deleteConfirmId === ct.id ? 'bg-red-500 text-white' : 'bg-red-50 hover:bg-red-500/30 border border-red-200 text-red-600'}`}
                              title={deleteConfirmId === ct.id ? "Click again to confirm" : "Delete Build"}
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                  );
                })}
              </div>
           </div>
         )}

         {/* Live Sandbox Preview Modal */}
         {previewTheme && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-150">
               <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row p-6 md:p-8 gap-6 md:gap-8 relative">
                  <button 
                     type="button"
                     onClick={() => setPreviewTheme(null)}
                     className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 p-2.5 rounded-full transition-colors cursor-pointer"
                  >
                     <X size={20} />
                  </button>

                  {/* Left Column: The actual Live Chess Board */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                     <div 
                        className="w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-2xl transition-all"
                        style={{
                           border: `12px solid ${previewTheme.borderColor || previewTheme.colors?.borderColor || previewTheme.dark || previewTheme.colors?.dark || '#627d41'}`
                        }}
                     >
                        <Chessboard 
                           showBoardNotation={false}
                           position={previewGameFen}
                           onPieceDrop={onPreviewDrop}
                           customPieces={previewCustomPieces}
                           customLightSquareStyle={{ backgroundColor: previewTheme.light || previewTheme.colors?.light || '#f0d9b5' }}
                           customDarkSquareStyle={{ backgroundColor: previewTheme.dark || previewTheme.colors?.dark || '#b58863' }}
                           boardWidth={396}
                        />
                     </div>
                  </div>

                  {/* Right Column: Custom Info & Active State Managers */}
                  <div className="w-full md:w-[320px] flex flex-col gap-5 justify-between select-none">
                     <div className="space-y-4">
                        <div>
                           <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest bg-blue-600/10 px-2.5 py-1 rounded-full border border-blue-600/20">Live Board Sandbox</span>
                           <h3 className="text-2xl font-black text-slate-950 mt-2 leading-tight">
                              {previewTheme.themeName || previewTheme.name}
                           </h3>
                           <p className="text-xs text-slate-400 font-bold mt-1">
                              Drag-and-drop pieces anywhere on the board to test.
                           </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2 font-medium">
                           <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                              <span>Outline texture layers preserved perfectly</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                              <span>Simulated sandbox testing workspace</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <button
                              type="button"
                              onClick={makeRandomMove}
                              className="bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 text-slate-700 font-bold py-3 px-3 rounded-2xl text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                           >
                              <Play size={14} /> Make Move
                           </button>
                           <button
                              type="button"
                              onClick={() => {
                                 if (previewGame) {
                                    previewGame.reset();
                                    setPreviewGameFen(previewGame.fen());
                                 }
                              }}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 px-3 rounded-2xl text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                           >
                              <RotateCcw size={14} /> Reset
                           </button>
                        </div>
                     </div>

                     <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                        {inventory.includes(previewTheme.id) || previewTheme.id === 'default' || previewTheme.isCustomBuild ? (
                           <button
                              type="button"
                              onClick={() => {
                                 handleEquip(previewTheme.id);
                                 setPreviewTheme(null);
                              }}
                              disabled={activeTheme === previewTheme.id}
                              className={`w-full py-4 px-4 rounded-2xl font-black text-xs transition-all tracking-wider uppercase select-none ${activeTheme === previewTheme.id ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-[0_4px_0_rgba(1,74,213,0.3)]'}`}
                           >
                              {activeTheme === previewTheme.id ? '✨ Already Equipped' : 'Equip Theme Set'}
                           </button>
                        ) : (
                           <button
                              type="button"
                              onClick={() => {
                                 const canAfford = coins >= previewTheme.cost;
                                 if (canAfford) {
                                    handleBuy(previewTheme.cost, previewTheme.id);
                                    setPreviewTheme(null);
                                 }
                              }}
                              disabled={coins < previewTheme.cost}
                              className={`w-full py-4 px-4 rounded-2xl font-black text-xs transition-all tracking-wider uppercase select-none flex items-center justify-center gap-1.5 ${coins >= previewTheme.cost ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 cursor-pointer shadow-lg shadow-amber-500/10' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}
                           >
                              <Coins size={14} /> Buy theme ({previewTheme.cost} Gold)
                           </button>
                        )}
                        <button
                           type="button"
                           onClick={() => setPreviewTheme(null)}
                           className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold py-3 px-4 rounded-2xl text-xs transition-colors cursor-pointer"
                        >
                           Close Preview
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
