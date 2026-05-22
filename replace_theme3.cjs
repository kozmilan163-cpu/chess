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
    { regex: /bg-white\/5([^0-9])/g, replacement: 'bg-slate-100$1' },
    { regex: /bg-white\/10/g, replacement: 'bg-slate-100' },
    { regex: /bg-white\/20/g, replacement: 'bg-slate-200' },
    { regex: /text-slate-600 hover:text-slate-900 transition-colors cursor-pointer bg-slate-100 p-2 rounded-full/g, replacement: 'text-slate-500 hover:text-slate-800 transition-colors cursor-pointer bg-slate-100 p-2 rounded-full' },
    { regex: /text-white border border-white\/10/g, replacement: 'text-slate-900 border border-slate-200' },
    { regex: /text-\[\#bababa\]/g, replacement: 'text-slate-600' }
];

filesToUpdate.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(rep => {
        content = content.replace(rep.regex, rep.replacement);
    });
    fs.writeFileSync(filePath, content);
});

console.log("Refined colors 3");
