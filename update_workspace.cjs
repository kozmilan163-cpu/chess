const fs = require('fs');
let content = fs.readFileSync('src/components/StudioWorkspace.tsx', 'utf8');

// 1. Update Mega Presets to just one button
const megaPresetRegex = /<h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1\.5">[\s\S]*?<\/div>\s*<\/div>/;
const newMegaPreset = `<h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
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
          </div>`;
content = content.replace(megaPresetRegex, newMegaPreset);

// 2. We'll simplify the board background section to "Upload" and "Clear" instead of predefined ones (to avoid confusion)
content = content.replace(/<div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar items-center">[\s\S]*?<\/div>[\s\n]*<\/div>[\s\n]*<\/div>/m, `<div className="flex gap-3 items-center mt-2">
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
            
            {/* Pieces Design studio */}`);

fs.writeFileSync('src/components/StudioWorkspace.tsx', content);
