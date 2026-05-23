import React, { useState } from 'react';
import { UserProfile, GeneratedTheme } from './Profile';
import { ShoppingCart, Coins, Sparkles, Check, Lock, Crown, Zap, Gift, ArrowRight, X } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { THEMES, PIECE_PRESETS } from './Shop';

interface ShopEnhancedProps {
  profile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onNavigateToTab?: (tab: 'play' | 'social' | 'profile' | 'shop' | 'studio') => void;
}

export function ShopEnhanced({ profile, onUpdateProfile, onNavigateToTab }: ShopEnhancedProps) {
  const coins = profile?.coins || 0;
  const inventory = profile?.inventory || ['default'];
  const activeTheme = profile?.activeBoardTheme || 'default';

  const [selectedTab, setSelectedTab] = useState<'themes' | 'pieces' | 'avatars'>('themes');
  const [previewTheme, setPreviewTheme] = useState<any | null>(null);
  const [previewGame, setPreviewGame] = useState<Chess | null>(null);
  const [previewGameFen, setPreviewGameFen] = useState('start');
  const [purchaseError, setPurchaseError] = useState('');
  const [justPurchased, setJustPurchased] = useState<string | null>(null);

  React.useEffect(() => {
    if (previewTheme) {
      const g = new Chess();
      g.move({ from: 'e2', to: 'e4', promotion: 'q' });
      setPreviewGame(g);
      setPreviewGameFen(g.fen());
    }
  }, [previewTheme]);

  const handlePurchase = (itemId: string, cost: number) => {
    setPurchaseError('');
    if (coins < cost) {
      setPurchaseError(`Need ${cost - coins} more coins`);
      return;
    }
    if (inventory.includes(itemId)) {
      setPurchaseError('Already owned');
      return;
    }

    const newInventory = [...inventory, itemId];
    onUpdateProfile({
      ...profile!,
      coins: coins - cost,
      inventory: newInventory,
    });
    setJustPurchased(itemId);
    setTimeout(() => setJustPurchased(null), 2000);
  };

  const handleEquip = (itemId: string) => {
    onUpdateProfile({
      ...profile!,
      activeBoardTheme: itemId,
    });
  };

  const isOwned = (itemId: string) => inventory.includes(itemId);
  const isEquipped = (itemId: string) => itemId === activeTheme;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900">
      {/* Header with coin balance */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">
            <Sparkles className="inline mr-2 text-blue-600" size={24} />
            Shop
          </h1>
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
            <Coins size={20} />
            <span className="text-lg">{coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto flex">
          {(['themes', 'pieces', 'avatars'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-3 text-sm font-bold capitalize transition-all ${
                selectedTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'pieces' ? '♞ Pieces' : tab === 'avatars' ? '🎭 Avatars' : '🎨 Themes'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 pb-8">
        {selectedTab === 'themes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {THEMES.map(theme => (
                <div
                  key={theme.id}
                  onClick={() => setPreviewTheme(theme)}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Theme preview */}
                  <div className="h-32 flex items-center justify-center p-2" style={{ background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.dark} 100%)` }}>
                    <div className="w-full max-w-[120px] rounded overflow-hidden shadow">
                      <Chessboard showBoardNotation={false} position="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" arePiecesDraggable={false} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-bold text-sm text-slate-900 truncate">{theme.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                        <Coins size={14} />
                        {theme.cost}
                      </div>
                      {isOwned(theme.id) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquip(theme.id);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isEquipped(theme.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isEquipped(theme.id) ? '✓ Equipped' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(theme.id, theme.cost);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'pieces' && (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">Coming soon: custom piece sets</p>
          </div>
        )}

        {selectedTab === 'avatars' && (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">Coming soon: avatar frames and borders</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTheme && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{previewTheme.name}</h2>
              <button onClick={() => setPreviewTheme(null)} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Large preview */}
              <div className="flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-8">
                {previewGame && (
                  <div className="w-full max-w-sm rounded-lg overflow-hidden shadow-xl">
                    <Chessboard showBoardNotation={false} position={previewGameFen} arePiecesDraggable={false} />
                  </div>
                )}
              </div>

              {/* Purchase/Equip actions */}
              <div className="flex gap-3">
                {isOwned(previewTheme.id) ? (
                  <button
                    onClick={() => {
                      handleEquip(previewTheme.id);
                      setPreviewTheme(null);
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      isEquipped(previewTheme.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    <Check size={18} />
                    {isEquipped(previewTheme.id) ? 'Currently Equipped' : 'Equip Theme'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handlePurchase(previewTheme.id, previewTheme.cost);
                    }}
                    disabled={coins < previewTheme.cost}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Coins size={18} />
                    Buy for {previewTheme.cost} coins
                  </button>
                )}
              </div>

              {purchaseError && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-rose-700 text-sm font-medium">
                  {purchaseError}
                </div>
              )}

              {justPurchased === previewTheme.id && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 text-sm font-bold flex items-center gap-2">
                  <Gift size={16} />
                  Purchased! Added to your inventory
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
