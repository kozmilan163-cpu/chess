const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/components');
const filesToUpdate = ['src/App.tsx'];

fs.readdirSync(directoryPath).forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filesToUpdate.push(path.join(directoryPath, file));
    }
});

const replacements = [
    // Backgrounds & Surfaces
    { regex: /bg-\[#302e2b\]/g, replacement: 'bg-slate-50' },
    { regex: /bg-\[#262421\]/g, replacement: 'bg-white' },
    { regex: /bg-\[#1c1a18\]/g, replacement: 'bg-white' },
    { regex: /bg-\[#191715\]/g, replacement: 'bg-white' },
    { regex: /bg-\[#201e1b\]/g, replacement: 'bg-slate-100' },
    { regex: /bg-black\/10/g, replacement: 'bg-slate-50' },
    { regex: /bg-black\/20/g, replacement: 'bg-slate-100' },
    { regex: /bg-black\/30/g, replacement: 'bg-slate-100' },
    { regex: /bg-black\/40/g, replacement: 'bg-slate-200' },
    { regex: /bg-black\/50/g, replacement: 'bg-slate-800' }, // Except badges maybe, we'll see
    { regex: /bg-black\/55/g, replacement: 'bg-slate-200' },
    { regex: /bg-black\/60/g, replacement: 'bg-slate-300' },
    
    // Text colors
    { regex: /text-\[#bababa\]/g, replacement: 'text-slate-600' },
    { regex: /text-\[#8b8987\]/g, replacement: 'text-slate-500' },
    { regex: /text-white/g, replacement: 'text-slate-900' },
    { regex: /text-white\/80/g, replacement: 'text-slate-700' },
    { regex: /text-white\/70/g, replacement: 'text-slate-600' },
    { regex: /text-white\/50/g, replacement: 'text-slate-500' },
    
    // Borders
    { regex: /border-white\/5/g, replacement: 'border-slate-200' },
    { regex: /border-white\/10/g, replacement: 'border-slate-200' },
    { regex: /border-white\/15/g, replacement: 'border-slate-300' },
    { regex: /border-white\/20/g, replacement: 'border-slate-300' },
    { regex: /border-black\/20/g, replacement: 'border-slate-200' },
    { regex: /border-zinc-800/g, replacement: 'border-slate-300' },
    
    // Brand / Accents
    { regex: /bg-\[#81b64c\]/g, replacement: 'bg-blue-600' },
    { regex: /text-\[#81b64c\]/g, replacement: 'text-blue-600' },
    { regex: /ring-\[#81b64c\]/g, replacement: 'ring-blue-600' },
    { regex: /border-\[#81b64c\]/g, replacement: 'border-blue-600' },
    
    // Yellows
    { regex: /text-amber-400/g, replacement: 'text-yellow-600' },
    { regex: /bg-amber-400/g, replacement: 'bg-yellow-400' },
    { regex: /text-amber-500/g, replacement: 'text-yellow-600' },
    { regex: /bg-amber-500/g, replacement: 'bg-yellow-500' },
    
    // Hover states
    { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-slate-50' },
    { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-slate-100' },
    { regex: /hover:text-white/g, replacement: 'hover:text-slate-900' },
    { regex: /hover:bg-\[#81b64c\]\/90/g, replacement: 'hover:bg-blue-700' },
    { regex: /hover:bg-\[#81b64c\]\/20/g, replacement: 'hover:bg-blue-50' },

    // Rounded corners styling to make it look smooth
    { regex: /rounded-xl/g, replacement: 'rounded-2xl' },
    // { regex: /rounded-lg/g, replacement: 'rounded-xl' },

    // Misc shadows
    { regex: /shadow-xl/g, replacement: 'shadow-lg' },
    { regex: /shadow-2xl/g, replacement: 'shadow-xl' },
    
    // Invert the text class that was inverted incorrectly inside badges
    // e.g. text-slate-900 inside bg-slate-800 ... actually I'll handle that manually if needed.
];

filesToUpdate.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(rep => {
        content = content.replace(rep.regex, rep.replacement);
    });
    fs.writeFileSync(filePath, content);
});

console.log("Replaced colors for Stitch theme");
