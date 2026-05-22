export interface PuzzleData {
  fen: string;
  solution: string[]; // SAN moves
  orientation: 'white' | 'black';
  title: string;
  url: string;
}

export const FALLBACK_PUZZLES: Record<string, Record<string, PuzzleData[]>> = {
  mate1: {
    beginner: [
      {
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
        solution: ['Qxf7#'],
        orientation: 'white',
        title: "Scholar's Mate (Mate in 1)",
        url: '#'
      },
      {
        fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
        solution: ['Rd8#'],
        orientation: 'white',
        title: 'Back-Rank Mate (Mate in 1)',
        url: '#'
      },
      {
        fen: '6rk/6pp/7N/8/8/8/8/6RK w - - 0 1',
        solution: ['Nf7#'],
        orientation: 'white',
        title: 'Smothered Mate (Mate in 1)',
        url: '#'
      },
      {
        fen: '6k1/5ppp/7Q/8/8/2B5/5PPP/6K1 w - - 0 1',
        solution: ['Qxg7#'],
        orientation: 'white',
        title: 'Helper Queen Mate (Mate in 1)',
        url: '#'
      },
      {
        fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
        solution: ['Qxf7#'],
        orientation: 'white',
        title: 'Simple Mate on f7',
        url: '#'
      }
    ],
    intermediate: [
      {
        fen: 'rnbqkbnr/pp3ppp/2p5/3pp3/4P3/3P1Q2/PPP2PPP/RNB1KBNR w KQkq - 0 1',
        solution: ['Qxf7#'],
        orientation: 'white',
        title: 'Overloaded Guard Mate',
        url: '#'
      },
      {
        fen: 'r5rk/5bpp/5b2/8/8/8/1Q6/6RK w - - 0 1',
        solution: ['Qxg7#'],
        orientation: 'white',
        title: 'Corridor Bishop Mate',
        url: '#'
      },
      {
        fen: '4r2k/5ppp/8/8/8/8/5PPP/3r2K1 b - - 0 1',
        solution: ['Rd1#'],
        orientation: 'black',
        title: 'Black Back-Rank Mate',
        url: '#'
      },
      {
        fen: '2r1r1rk/5ppp/8/8/8/8/5PPP/4Q1RK w - - 0 1',
        solution: ['Qxg7#'],
        orientation: 'white',
        title: 'Heavy Piece Infiltration',
        url: '#'
      }
    ],
    advanced: [
      {
        fen: '3qr1k1/5p1p/6pQ/4N3/8/8/5PPP/6K1 w - - 0 1',
        solution: ['Qf8#'],
        orientation: 'white',
        title: 'Advanced Anastasia Attacker',
        url: '#'
      },
      {
        fen: '6k1/Rpr4p/4p1p1/1N1pb3/8/5P2/6PP/6K1 b - - 0 1',
        solution: ['Rc1#'],
        orientation: 'black',
        title: 'Discovered Defensive Pin Mate',
        url: '#'
      }
    ],
    master: [
      {
        fen: '3R2k1/pp3p1p/4p1pQ/4N3/2b5/P4P2/qP4PP/r4NK1 b - - 0 1',
        solution: ['Rxf1#'],
        orientation: 'black',
        title: 'Master Counter-Infiltration Mate',
        url: '#'
      },
      {
        fen: 'r4rk1/p4p1p/1qp1b1pB/3n4/8/1PbB4/P1Q2PPP/3R1RK1 w - - 0 1',
        solution: ['Qxg6#'],
        orientation: 'white',
        title: 'Double Sacrificed Deflector Mate',
        url: '#'
      }
    ]
  },
  mate2: {
    beginner: [
      {
        fen: '7k/4N1pp/8/7Q/8/3R4/8/6K1 w - - 0 1',
        solution: ['Qxh7+', 'Kxh7', 'Rh3#'],
        orientation: 'white',
        title: "Anastasia's Mate (Mate in 2)",
        url: '#'
      },
      {
        fen: '5r1k/6pp/7N/8/8/1Q6/8/6K1 w - - 0 1',
        solution: ['Qg8+', 'Rxg8', 'Nf7#'],
        orientation: 'white',
        title: "Philidor's Smothered Mate (Mate in 2)",
        url: '#'
      },
      {
        fen: 'r1bqkb1r/ppppp1pp/2n2n2/5p2/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
        solution: ['Qxf5', 'd6', 'Qf7#'],
        orientation: 'white',
        title: 'Greedy Attack Mate',
        url: '#'
      }
    ],
    intermediate: [
      {
        fen: 'r4r1k/pp3ppp/8/4N3/8/1Q6/PP3PPP/6K1 w - - 0 1',
        solution: ['Nf7+', 'Kg8', 'Nh6#'],
        orientation: 'white',
        title: 'Double Smother Check Tactics',
        url: '#'
      },
      {
        fen: '6rk/5ppp/8/8/8/8/3B4/Q5K1 w - - 0 1',
        solution: ['Qxg7+', 'Rxg7+', 'Bc3#'],
        orientation: 'white',
        title: 'Pinned Guard Decoy Mate',
        url: '#'
      }
    ],
    advanced: [
      {
        fen: 'r1b2r1k/1pq3pp/p1np4/4P1N1/2B4Q/8/PP3PPP/R4RK1 w - - 0 1',
        solution: ['Qxh7#'],
        orientation: 'white',
        title: 'H-File Greek Gift Followup',
        url: '#'
      }
    ],
    master: [
      {
        fen: 'r3k2r/ppb2ppp/2p5/4q2b/4P3/2NQ3P/PPP2PP1/R1B2RK1 b kq - 0 1',
        solution: ['Qh2#'],
        orientation: 'black',
        title: 'Grandmaster Battery Mate',
        url: '#'
      }
    ]
  },
  fork: {
    beginner: [
      {
        fen: '7k/5p1p/3q4/6N1/8/8/PP3PPP/R1B1K2R w KQ - 0 1',
        solution: ['Nxf7+', 'Kg8', 'Nxd6'],
        orientation: 'white',
        title: 'Royal Knight Fork (Win the Queen)',
        url: '#'
      },
      {
        fen: 'r3k2r/pppb1ppp/2np4/1N4q1/4P3/8/PPP2PPP/R1BQKB1R w KQkq - 0 1',
        solution: ['Nxc7+', 'Kd8', 'Nxa8'],
        orientation: 'white',
        title: 'Decisive Knight Fork (Win the Rook)',
        url: '#'
      },
      {
        fen: '2r3k1/5ppp/8/3N4/8/8/PP3PPP/4R1K1 w - - 0 1',
        solution: ['Ne7+', 'Kf8', 'Nxc8'],
        orientation: 'white',
        title: 'Simple Back-Rank Setup Fork',
        url: '#'
      }
    ],
    intermediate: [
      {
        fen: 'r1bqk2r/ppp2ppp/2np1n2/4p3/1b2P3/2NP1N2/PPPQBPPP/R1B1K2R w KQkq - 0 1',
        solution: ['Nxe5', 'dxe5', 'Qxb4'],
        orientation: 'white',
        title: 'Discovered Capture Fork',
        url: '#'
      },
      {
        fen: 'r3kbnr/ppp2ppp/2n5/3qpb2/4N3/P2P1N2/1PP2PPP/R1BQKB1R w KQkq - 0 1',
        solution: ['Nd6+', 'Bxd6', 'Qxd5'],
        orientation: 'white',
        title: 'Infiltrating Knight Fork',
        url: '#'
      }
    ],
    advanced: [
      {
        fen: '3r2k1/pp3ppp/1qp5/2n1N3/4P3/8/PPP1QPPP/2KR4 w - - 0 1',
        solution: ['Rxd8+', 'Qxd8', 'Nxf7'],
        orientation: 'white',
        title: 'Discovered Deflection Fork',
        url: '#'
      }
    ],
    master: [
      {
        fen: '2r2rk1/1ppq1ppp/p1np1nb1/4p3/1b2P3/2PP1NNP/PPB2PP1/R1BQR1K1 b - - 0 1',
        solution: ['Bxc3', 'bxc3', 'Nxe4'],
        orientation: 'black',
        title: 'Tactical Center Fork Sacrifice',
        url: '#'
      }
    ]
  },
  pin: {
    beginner: [
      {
        fen: 'r3k2r/pp3ppp/2p5/4q3/8/8/PPP2PPP/R2R2K1 w kq - 0 1',
        solution: ['Re1', 'Qxe1+', 'Rxe1+'],
        orientation: 'white',
        title: 'Queen Pin on the E-File',
        url: '#'
      },
      {
        fen: '4k3/8/4r3/8/8/1Q6/4P3/4K3 w - - 0 1',
        solution: ['Qxe6+', 'Kf8'],
        orientation: 'white',
        title: 'Heavy Piece Pin-and-Win',
        url: '#'
      }
    ],
    intermediate: [
      {
        fen: 'r3r1k1/ppp2ppp/3b4/8/2B5/1Q3P2/PP3PKP/R1B1R3 b - - 0 1',
        solution: ['Rxe1', 'Bxe1', 'Rb1'],
        orientation: 'black',
        title: 'Intermediate Rook Discovered Pin',
        url: '#'
      }
    ],
    advanced: [
      {
        fen: '4r1k1/pppq1ppp/5nb1/3p4/8/1P1P1N1P/P1P1NPP1/R1B1Q1K1 b - - 0 1',
        solution: ['Rxe2', 'Qxe2', 'Bxd3'],
        orientation: 'black',
        title: 'Advanced Diagonal Deflection Skewer',
        url: '#'
      }
    ],
    master: [
      {
        fen: '2kr3r/pppq1ppp/2nb1n2/1B1pNb2/3P1B2/2N1Q3/PPP2PPP/R3K2R b KQ - 0 1',
        solution: ['Bxe5', 'dxe5', 'd4'],
        orientation: 'black',
        title: 'Tactical Counter-Pin Breakthrough',
        url: '#'
      }
    ]
  },
  endgame: {
    beginner: [
      {
        fen: '7R/P7/8/8/8/8/1k6/r6K w - - 0 1',
        solution: ['a8=Q', 'Rxa8', 'Rh2+', 'Kb3', 'Rxa8'],
        orientation: 'white',
        title: "Lasker's Legendary Skewer Tactic",
        url: '#'
      },
      {
        fen: '8/p7/1p6/8/k7/2P5/8/1K6 w - - 0 1',
        solution: ['Kb2', 'a6', 'Ka2'],
        orientation: 'white',
        title: 'Endgame Defosition/Opposition',
        url: '#'
      }
    ],
    intermediate: [
      {
        fen: 'k7/P7/1K6/8/8/8/8/8 b - - 0 1',
        solution: ['Kxb6'],
        orientation: 'black',
        title: 'Opposition Stalemate Trap',
        url: '#'
      }
    ],
    advanced: [
      {
        fen: '8/8/p1k1p3/1p2P3/1P1K4/P7/8/8 w - - 0 1',
        solution: ['Ke4', 'Kb6', 'Kd4'],
        orientation: 'white',
        title: 'Kingside Triangulation Opposition',
        url: '#'
      }
    ],
    master: [
      {
        fen: '8/6P1/4k3/1pr1B3/1K6/8/8/8 w - - 0 1',
        solution: ['g8=Q+', 'Kxe5', 'Qg5+'],
        orientation: 'white',
        title: 'Master Double Promotion Deflection',
        url: '#'
      }
    ]
  }
};
