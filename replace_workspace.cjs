const fs = require('fs');

let content = fs.readFileSync('src/components/StudioWorkspace.tsx', 'utf8');

// 1. Remove medieval and animals from preset images
content = content.replace(/medieval: \{[\s\S]*?\},[\s\n]*animals: \{[\s\S]*?\}\n/m, '');

// 2. Fix useTextureMode references
content = content.replace(/const \[useTextureMode, setUseTextureMode\] = useState\(true\);\n/m, '');
content = content.replace(/const \[useTextureMode, setUseTextureMode\] = useState\(false\);\n/m, '');


// 3. Remove useTextureMode from loadPiecePreset
content = content.replace(/if \(presetName === 'animals'\) \{[\s\S]*?\} else \{[\s\n]*setUseTextureMode\(false\);[\s\n]*\}/m, '');

// 4. Remove UI toggle for mask mode
const maskToggleRegex = /<label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">[\s\S]*?<\/label>/;
content = content.replace(maskToggleRegex, '');

// 5. Remove grid collections
const megaPresetRegex = /\{\/\* Mega Presets Collection \*\/\}.*?Mega Presets Collection.*?<\/div>.*?<\/div>/s;
content = content.replace(megaPresetRegex, '');

// 6. Enforce texture mode
content = content.replace(/useTextureMode \? \(/g, 'true ? (');
content = content.replace(/\} : \([\s\S]*?<\/img>\n[\s]*\)\}/m, '}');

// Make sure we have useTextureMode = true for any leftover references
content = content.replace(/const handleForge/g, 'const useTextureMode = true; const handleForge');

// Just remove all Mega Presets completely by string match if regex fails
let startIdx = content.indexOf('{/* Mega Presets Collection */}');
if (startIdx !== -1) {
    let endIdx = content.indexOf('</div>', content.indexOf('</div>', startIdx) + 6);
    if (endIdx !== -1) {
        // Find next div
        endIdx = content.indexOf('</div>', endIdx + 6) + 6;
        content = content.slice(0, startIdx) + content.slice(endIdx);
    }
}

fs.writeFileSync('src/components/StudioWorkspace.tsx', content);
console.log('Replaced Workspace');
