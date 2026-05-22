export const playChessSound = (type: 'move' | 'capture' | 'check' | 'gameEnd') => {
  try {
    const urls = {
      move: 'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3',
      capture: 'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3',
      check: 'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3',
      gameEnd: 'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'
    };
    const audio = new Audio(urls[type]);
    audio.play().catch(() => {});
  } catch (e) {}
};
