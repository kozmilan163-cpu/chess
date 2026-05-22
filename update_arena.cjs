const fs = require('fs');

let content = fs.readFileSync('src/components/TournamentArena.tsx', 'utf8');

// Add KnockoutBracket import
content = content.replace("import { THEMES } from './Shop';", "import { THEMES } from './Shop';\nimport { KnockoutBracket, MatchNode } from './KnockoutBracket';");

// Check if format is knockout
content = content.replace("const currentTourney = tournaments.find(", "const isKnockout = tournaments.find(t => t.id === tournamentId)?.format.includes('KNOCKOUT') || false;\n  const currentTourney = tournaments.find(");

// Add bracket state
content = content.replace("const [claimedReward, setClaimedReward] = useState(false);", "const [claimedReward, setClaimedReward] = useState(false);\n  const [bracketRounds, setBracketRounds] = useState<MatchNode[][]>([]);");

// Seed bracket in useEffect where initialList is added
const bracketSeed = `
    if (tournaments.find(t => t.id === tournamentId)?.format.includes('KNOCKOUT')) {
      const qfMatches = [];
      for(let i = 0; i < 4; i++) {
        qfMatches.push({
          id: \`qf_\${i}\`,
          player1: { name: initialList[i*2].title + ' ' + initialList[i*2].name, score: null, isUser: initialList[i*2].isUser },
          player2: { name: initialList[i*2+1].title + ' ' + initialList[i*2+1].name, score: null, isUser: initialList[i*2+1].isUser }
        });
      }
      setBracketRounds([
        qfMatches,
        [ { id: 'sf_0', player1: null, player2: null }, { id: 'sf_1', player1: null, player2: null } ],
        [ { id: 'f_0', player1: null, player2: null } ]
      ]);
    }
`;

content = content.replace("setParticipants(initialList.sort((a, b) => b.score - a.score || b.rating - a.rating));", 
  "setParticipants(initialList.sort((a, b) => b.score - a.score || b.rating - a.rating));\n" + bracketSeed);

// Update Left Column to show Bracket if isKnockout
const replaceLeftColumn = `
        {/* Left Column (Standings & Rolling live-updating feed) */}
        <div className="lg:col-span-4 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
          
          <div className="p-4 border-b border-slate-200 bg-white">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between mb-3">
              <span>{isKnockout ? 'Knockout Stages' : 'Arena Standings Table'}</span>
              <span className="text-blue-600 flex items-center gap-1"><Users size={12}/> {participants.length} {isKnockout ? 'Contenders' : 'Masters'}</span>
            </h3>`;

content = content.replace(/\{\/\* Left Column[\s\S]*?Masters<\/span>[\s]*<\/h3>/, replaceLeftColumn);

const bracketRender = `
          {isKnockout ? (
            <div className="flex-1 overflow-x-auto bg-slate-50 scrollbar-thin">
              <KnockoutBracket rounds={bracketRounds} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
`;

content = content.replace('<div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">', bracketRender);

// Close bracket render block just before the live match ticker
content = content.replace(/\{\/\* Live scrolling game match ticker \*\/\}/, 
`}
          {/* Live scrolling game match ticker */}`);

fs.writeFileSync('src/components/TournamentArena.tsx', content);
