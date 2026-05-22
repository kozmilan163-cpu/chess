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
    { regex: /bg-slate-800/g, replacement: 'bg-white' }, // changed to white for better contrast as cards
    
    // AIAnalysis.tsx specific
    { regex: /prose-invert/g, replacement: '' },
    { regex: /text-slate-300/g, replacement: 'text-slate-800' },
    { regex: /text-red-400/g, replacement: 'text-red-600' },
    { regex: /bg-red-900\/20/g, replacement: 'bg-red-50' },
    { regex: /bg-blue-500\/10/g, replacement: 'bg-blue-50' },
    { regex: /border-blue-500\/20/g, replacement: 'border-blue-200' },
    { regex: /text-blue-200\/90/g, replacement: 'text-blue-800' },
    
    // Puzzles.tsx specific colors
    { regex: /bg-emerald-500\/20/g, replacement: 'bg-green-50' },
    { regex: /border-emerald-500\/30/g, replacement: 'border-green-200' },
    { regex: /text-emerald-400/g, replacement: 'text-green-600' },
    { regex: /bg-emerald-500 hover:bg-emerald-400 text-black/g, replacement: 'bg-green-600 hover:bg-green-700 text-white' },
    { regex: /text-emerald-400\/80/g, replacement: 'text-green-600' },
    
    { regex: /bg-red-500\/10/g, replacement: 'bg-red-50' },
    { regex: /border-red-500\/20/g, replacement: 'border-red-200' },
    { regex: /border-red-500\/30/g, replacement: 'border-red-200' },
    { regex: /text-red-400\/70/g, replacement: 'text-red-500' },
    { regex: /bg-red-500\/20 hover:bg-red-500\/30/g, replacement: 'bg-red-100 hover:bg-red-200' },
    
    { regex: /bg-amber-500\/10/g, replacement: 'bg-yellow-50' },
    { regex: /border-amber-500\/20/g, replacement: 'border-yellow-200' },
    { regex: /text-amber-400\/70/g, replacement: 'text-yellow-600' },
    
    // Make text contrast valid on lighter bg
    { regex: /bg-blue-600 hover:bg-blue-600\/90 text-slate-900/g, replacement: 'bg-blue-600 hover:bg-blue-700 text-white' }, 
    { regex: /bg-blue-600 text-slate-900/g, replacement: 'bg-blue-600 text-white' },
    { regex: /bg-blue-600([^\>]*?)text-slate-900/g, replacement: 'bg-blue-600$1text-white' },
    
    { regex: /bg-black\/40 hover:bg-black\/60 text-slate-900/g, replacement: 'bg-slate-200 hover:bg-slate-300 text-slate-900' },
    { regex: /bg-black\/40/g, replacement: 'bg-slate-100' },
    { regex: /text-black/g, replacement: 'text-white' }
];

filesToUpdate.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(rep => {
        content = content.replace(rep.regex, rep.replacement);
    });
    fs.writeFileSync(filePath, content);
});

console.log("Refined colors 2");
