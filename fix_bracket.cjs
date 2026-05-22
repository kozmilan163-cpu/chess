const fs = require('fs');

let content = fs.readFileSync('src/components/TournamentArena.tsx', 'utf8');

const regex = /<\/div>\s*}\s*{\/\* Live scrolling game match ticker \*\//g;
content = content.replace(regex, '</div>)} {/* Live scrolling game match ticker */}');

fs.writeFileSync('src/components/TournamentArena.tsx', content);
