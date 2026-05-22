import React from 'react';
import { User, Trophy } from 'lucide-react';

export interface MatchNode {
  id: string;
  player1: { name: string; score: number | null; isUser?: boolean } | null;
  player2: { name: string; score: number | null; isUser?: boolean } | null;
  winner?: string;
}

export interface KnockoutBracketProps {
  rounds: MatchNode[][]; // Array of rounds, each round is an array of matches
  currentRoundIndex?: number;
}

export function KnockoutBracket({ rounds, currentRoundIndex = 0 }: KnockoutBracketProps) {
  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto p-8 bg-slate-50 min-h-[500px] flex items-center justify-start">
      <div className="flex relative">
        {rounds.map((round, rIndex) => (
          <div key={rIndex} className="flex flex-col justify-around min-w-[200px]" style={{ marginRight: rIndex === rounds.length - 1 ? 0 : '80px' }}>
            
            {round.map((match, mIndex) => {
              const showRightConnector = rIndex < rounds.length - 1;
              const isTopInPair = mIndex % 2 === 0;

              return (
                <div key={match.id} className="relative flex flex-col justify-center" style={{ margin: '16px 0', height: `\${Math.pow(2, rIndex) * 80}px` }}>
                  
                  {/* The Match Card */}
                  <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden z-10 w-full relative">
                    <div className={`flex justify-between items-center p-2 border-b border-slate-100 \${match.player1?.isUser ? 'bg-blue-50/50' : ''}`}>
                      <span className={`text-xs font-bold truncate pr-2 \${match.winner === match.player1?.name ? 'text-slate-900' : 'text-slate-500'}`}>
                        {match.player1?.name || '-'}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-700">{match.player1?.score ?? '-'}</span>
                    </div>
                    <div className={`flex justify-between items-center p-2 \${match.player2?.isUser ? 'bg-blue-50/50' : ''}`}>
                      <span className={`text-xs font-bold truncate pr-2 \${match.winner === match.player2?.name ? 'text-slate-900' : 'text-slate-500'}`}>
                        {match.player2?.name || '-'}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-700">{match.player2?.score ?? '-'}</span>
                    </div>
                    
                    {rIndex === rounds.length - 1 && match.winner && (
                       <div className="absolute -top-3 -right-3 bg-yellow-400 text-white rounded-full p-1.5 shadow-lg">
                          <Trophy size={14} />
                       </div>
                    )}
                  </div>

                  {/* Connectors to next round (Curved Brackets) */}
                  {showRightConnector && (
                    <div 
                      className="absolute right-[-40px] w-[40px] border-slate-300"
                      style={{
                        top: '50%',
                        height: `\${Math.pow(2, rIndex) * 40 + 8}px`,
                        borderRightWidth: '2px',
                        borderTopWidth: isTopInPair ? '2px' : '0',
                        borderBottomWidth: !isTopInPair ? '2px' : '0',
                        borderTopRightRadius: isTopInPair ? '12px' : '0',
                        borderBottomRightRadius: !isTopInPair ? '12px' : '0',
                        transform: isTopInPair ? 'translateY(0)' : 'translateY(-100%)'
                      }}
                    />
                  )}
                  {/* Connector from previous round */}
                  {rIndex > 0 && (
                     <div 
                        className="absolute left-[-40px] w-[40px] border-slate-300 border-b-2"
                        style={{ top: '50%' }}
                     />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
