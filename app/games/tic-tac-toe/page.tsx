'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaRedoAlt, FaInfoCircle } from 'react-icons/fa';

type Board = (string | null)[];
type Player = 'X' | 'O';

// Sound manager using AudioContext
const useGameSounds = () => {
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContext.current = new window.AudioContext();
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const playSound = (frequency: number, duration: number) => {
    if (!audioContext.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(
      frequency,
      audioContext.current.currentTime
    );
    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);

    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + duration);
  };

  return {
    playMove: () => playSound(523.25, 0.1),
    playWin: () => playSound(783.99, 0.5),
    playLoss: () => playSound(220.0, 0.5),
    playDraw: () => playSound(329.63, 0.3),
  };
};

// Minimax Algorithm Explanation:
// - Recursive algorithm for decision-making in zero-sum games
// - Evaluates all possible moves to find optimal play
// - Maximizes player's advantage while minimizing opponent's
// - Uses depth to prefer faster wins/slower losses
const minimax = (
  board: Board,
  player: Player,
  depth: number,
  maximizingPlayer: boolean
): { value: number; move?: number } => {
  const winner = calculateWinner(board);
  const availableMoves = board.reduce(
    (acc, curr, idx) => (curr === null ? [...acc, idx] : acc),
    [] as number[]
  );

  if (winner || availableMoves.length === 0 || depth === 0) {
    if (winner === 'X') return { value: 1 * depth };
    if (winner === 'O') return { value: -1 * depth };
    return { value: 0 };
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMove = -1;

    for (const move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = player;
      const evaluation = minimax(newBoard, player, depth - 1, false).value;
      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
    }
    return { value: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    let bestMove = -1;

    for (const move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = player === 'X' ? 'O' : 'X';
      const evaluation = minimax(newBoard, player, depth - 1, true).value;
      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
    }
    return { value: minEval, move: bestMove };
  }
};

const calculateWinner = (board: Board): Player | null => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
};

export default function TicTacToe() {
  const { playMove, playWin, playLoss, playDraw } = useGameSounds();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [playerState, setPlayerState] = useState<{
    startingPlayer: Player;
    currentPlayer: Player;
  }>({
    startingPlayer: 'O',
    currentPlayer: 'O',
  });
  const [scores, setScores] = useState({ wins: 0, losses: 0, draws: 0 });
  const [gameStatus, setGameStatus] = useState<
    'playing' | 'won' | 'lost' | 'draw'
  >('playing');
  const [difficulty, setDifficulty] = useState(6);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const savedDifficulty = localStorage.getItem('tic-tac-toe-difficulty');
    if (savedDifficulty) {
      setDifficulty(Number(savedDifficulty));
    }
  }, []);

  const handleDifficultyChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newDifficulty = Number(event.target.value);
    setDifficulty(newDifficulty);
    localStorage.setItem('tic-tac-toe-difficulty', newDifficulty.toString());
  };

  const makeMove = useCallback(
    (index: number) => {
      if (
        board[index] ||
        playerState.currentPlayer === 'X' ||
        gameStatus !== 'playing'
      )
        return;

      const newBoard = [...board];
      newBoard[index] = 'O';
      setBoard(newBoard);
      playMove();
      setPlayerState((prev) => ({ ...prev, currentPlayer: 'X' }));
    },
    [board, playerState.currentPlayer, gameStatus, playMove]
  );

  const aiMove = useCallback(() => {
    if (playerState.currentPlayer !== 'X' || gameStatus !== 'playing') return;

    setTimeout(() => {
      if (gameStatus !== 'playing') return; // Additional guard clause

      const { move } = minimax(board, 'X', difficulty, true);
      if (move === undefined) return;

      const newBoard = [...board];
      newBoard[move] = 'X';
      setBoard(newBoard);
      playMove();
      setPlayerState((prev) => ({ ...prev, currentPlayer: 'O' }));
    }, 500);
  }, [board, playerState.currentPlayer, gameStatus, playMove, difficulty]);

  useEffect(() => {
    const winner = calculateWinner(board);
    const isDraw = !winner && !board.includes(null);

    if (winner === 'O') {
      playWin();
      setScores((s) => ({ ...s, wins: s.wins + 1 }));
      setGameStatus('won');
      restartGame();
    } else if (winner === 'X') {
      playLoss();
      setScores((s) => ({ ...s, losses: s.losses + 1 }));
      setGameStatus('lost');
      restartGame();
    } else if (isDraw) {
      playDraw();
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      setGameStatus('draw');
      restartGame();
    } else {
      aiMove();
    }
  }, [board, aiMove, playWin, playLoss, playDraw]);

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setPlayerState((prev) => ({
      startingPlayer: prev.startingPlayer === 'O' ? 'X' : 'O',
      currentPlayer: prev.startingPlayer === 'O' ? 'X' : 'O',
    }));
    setGameStatus('playing');
  };

  const restartAll = () => {
    restartGame();
    setScores({ wins: 0, losses: 0, draws: 0 });
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') restartAll();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [restartGame]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400">Tic Tac Toe</h1>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
          >
            <FaInfoCircle /> {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {showDetails && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Minimax Algorithm</h2>
            <p className="text-gray-300">
              The Minimax algorithm is a recursive algorithm used for
              decision-making in zero-sum games. It evaluates all possible moves
              to find the optimal play by maximizing the player's advantage
              while minimizing the opponent's. The algorithm uses depth to
              prefer faster wins and slower losses.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <label
              htmlFor="difficulty"
              className="text-lg font-semibold text-gray-400"
            >
              Difficulty:
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={handleDifficultyChange}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              <option value={2}>Easy</option>
              <option value={6}>Medium</option>
              <option value={9}>Impossible</option>
            </select>
          </div>
          <button
            onClick={restartAll}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
          >
            <FaRedoAlt /> Restart (R)
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="bg-green-600/20 p-4 rounded-lg">
              <h3 className="text-sm text-green-400 mb-1">Wins</h3>
              <p className="text-2xl font-bold">{scores.wins}</p>
            </div>
            <div className="bg-blue-600/20 p-4 rounded-lg">
              <h3 className="text-sm text-blue-400 mb-1">Draws</h3>
              <p className="text-2xl font-bold">{scores.draws}</p>
            </div>
            <div className="bg-red-600/20 p-4 rounded-lg">
              <h3 className="text-sm text-red-400 mb-1">Losses</h3>
              <p className="text-2xl font-bold">{scores.losses}</p>
            </div>
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-2 bg-gray-700 p-2 rounded-lg">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => makeMove(index)}
                disabled={
                  gameStatus !== 'playing' || playerState.currentPlayer === 'X'
                }
                className={`aspect-square text-5xl font-bold rounded-md transition-all
                  ${cell ? 'cursor-default' : 'hover:bg-gray-600'}
                  ${cell === 'O' ? 'text-green-400 bg-green-400/10' : ''}
                  ${cell === 'X' ? 'text-red-400 bg-red-400/10' : ''}
                  ${!cell && gameStatus === 'playing' ? 'text-gray-400' : ''}`}
              >
                {cell === 'O' ? '○' : cell === 'X' ? '×' : ''}
              </button>
            ))}
          </div>

          {/* Turn Indicator with Symbols */}
          <div className="mt-6 text-center">
            <p className="text-xl font-semibold">
              {gameStatus === 'playing' ? (
                playerState.currentPlayer === 'O' ? (
                  <span className="text-green-400">Your turn (○)</span>
                ) : (
                  <span className="text-red-400">AI's turn (×)</span>
                )
              ) : gameStatus === 'won' ? (
                <span className="text-green-400">You won (○)!</span>
              ) : gameStatus === 'lost' ? (
                <span className="text-red-400">AI won (×)!</span>
              ) : (
                <span className="text-blue-400">It's a draw!</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 text-gray-400 text-center text-md">
          <p>Minimax AI with depth {difficulty}</p>
        </div>
      </div>
    </div>
  );
}
