'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlay, FaPause, FaRedoAlt, FaInfoCircle } from 'react-icons/fa';
import { useInterval } from 'react-use';

const GRID_SIZE = { x: 100, y: 100 };
const CELL_SIZE = 20;
const INITIAL_PATTERN = [
  [GRID_SIZE.x / 2 - 1, GRID_SIZE.x / 2],
  [GRID_SIZE.x / 2, GRID_SIZE.x / 2 - 1],
  [GRID_SIZE.x / 2, GRID_SIZE.x / 2 + 2],
  [GRID_SIZE.x / 2 + 1, GRID_SIZE.x / 2 - 1],
  [GRID_SIZE.x / 2 + 1, GRID_SIZE.x / 2 + 2],
  [GRID_SIZE.x / 2 + 2, GRID_SIZE.x / 2],
];

export default function GameOfLife() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<number[][]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(4); // Default value for x1 speed
  // const [generation, setGeneration] = useState(0);
  const [showRules, setShowRules] = useState(true);

  // Initialize grid
  useEffect(() => {
    const newGrid = Array(GRID_SIZE.x)
      .fill(0)
      .map(() => Array(GRID_SIZE.y).fill(0));

    INITIAL_PATTERN.forEach(([x, y]) => (newGrid[x][y] = 1));
    setGrid(newGrid);
    drawCanvas(newGrid);
  }, []);

  // Drawing functions
  const drawCanvas = useCallback((currentGrid: number[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= GRID_SIZE.x; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_SIZE.y; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(canvas.width, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw cells
    ctx.fillStyle = '#3b82f6';
    currentGrid.forEach((row, x) => {
      row.forEach((cell, y) => {
        if (cell === 1) {
          ctx.fillRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
        }
      });
    });
  }, []);

  // Grid interaction
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);

    if (x >= 0 && x < GRID_SIZE.x && y >= 0 && y < GRID_SIZE.y) {
      const newGrid = [...grid];
      newGrid[x][y] = newGrid[x][y] ? 0 : 1;
      setGrid(newGrid);
      drawCanvas(newGrid);
    }
  };

  // Game logic
  const countNeighbors = (x: number, y: number) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newX = (x + i + GRID_SIZE.x) % GRID_SIZE.x;
        const newY = (y + j + GRID_SIZE.y) % GRID_SIZE.y;
        count += grid[newX][newY];
      }
    }
    return count;
  };

  const nextEpoch = () => {
    setGrid((current) => {
      const newGrid = current.map((row, x) =>
        row.map((cell, y) => {
          const neighbors = countNeighbors(x, y);
          return cell
            ? neighbors === 2 || neighbors === 3
              ? 1
              : 0
            : neighbors === 3
            ? 1
            : 0;
        })
      );
      drawCanvas(newGrid);
      // setGeneration((g) => g + 1);
      return newGrid;
    });
  };

  // Controls
  const resetGame = () => {
    const newGrid = Array(GRID_SIZE.x)
      .fill(0)
      .map(() => Array(GRID_SIZE.y).fill(0));

    INITIAL_PATTERN.forEach(([x, y]) => (newGrid[x][y] = 1));
    setGrid(newGrid);
    drawCanvas(newGrid);
    // setGeneration(0);
    setSpeed(4); // Reset speed to default x1
    setIsRunning(false);
  };

  useInterval(nextEpoch, isRunning ? 500 / speed : null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'p':
          setIsRunning(!isRunning);
          break;
        case 'r':
          resetGame();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning]);

  const liveCells = grid.flat().filter((cell) => cell === 1).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-400">Game of Life</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowRules(!showRules)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded"
            >
              <FaInfoCircle /> {showRules ? 'Hide Rules' : 'Show Rules'}
            </button>
          </div>
        </div>

        {showRules && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Rules of the Game</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Any live cell with 2 or 3 live neighbors survives</li>
              <li>Any dead cell with exactly 3 live neighbors becomes alive</li>
              <li>All other cells die or stay dead</li>
              <li>Click cells to toggle them</li>
            </ul>
          </div>
        )}

        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
              >
                {isRunning ? <FaPause /> : <FaPlay />}
                {isRunning ? 'Pause (P)' : 'Start (P)'}
              </button>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              >
                <FaRedoAlt /> Reset (R)
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Speed:</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-32"
                />
                <span>{(speed / 4).toFixed(2)}x</span>
              </div>

              <div className="text-gray-300">Cells: {liveCells}</div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={GRID_SIZE.x * CELL_SIZE}
            height={GRID_SIZE.y * CELL_SIZE}
            onClick={handleCanvasClick}
            className="cursor-pointer w-full rounded border-2 border-gray-700"
          />
        </div>
      </div>
    </div>
  );
}
