'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlay, FaPause, FaRedoAlt } from 'react-icons/fa';
import { useInterval } from 'react-use';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const lastProcessedDirection = useRef({ x: 0, y: 0 });

  // Audio initialization
  useEffect(() => {
    const ctx = new window.AudioContext();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  const playBeep = useCallback(() => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [audioContext]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection({ x: 0, y: 0 });
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const generateFood = () => ({
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  });

  const checkCollision = (head: { x: number; y: number }) => {
    return snake.some(
      (segment, index) =>
        index !== 0 && segment.x === head.x && segment.y === head.y
    );
  };

  const gameLoop = useCallback(() => {
    if (gameOver || isPaused) return;

    lastProcessedDirection.current = direction;

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = {
        x: (newSnake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (newSnake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (checkCollision(head)) {
        setGameOver(true);
        return prevSnake;
      }

      newSnake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 100);
        setFood(generateFood());
        playBeep();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, playBeep]);

  useInterval(gameLoop, isPaused || gameOver ? null : 150);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (lastProcessedDirection.current.y !== 1)
            setDirection({ x: 0, y: -1 });
          break;
        case 'arrowdown':
        case 's':
          if (lastProcessedDirection.current.y !== -1)
            setDirection({ x: 0, y: 1 });
          break;
        case 'arrowleft':
        case 'a':
          if (lastProcessedDirection.current.x !== 1)
            setDirection({ x: -1, y: 0 });
          break;
        case 'arrowright':
        case 'd':
          if (lastProcessedDirection.current.x !== -1)
            setDirection({ x: 1, y: 0 });
          break;
        case 'p':
          setIsPaused(!isPaused);
          break;
        case 'r':
          resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isPaused]);

  const draw = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw snake
      snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#10b981' : '#059669';
        ctx.fillRect(
          segment.x * (canvas.width / GRID_SIZE),
          segment.y * (canvas.height / GRID_SIZE),
          canvas.width / GRID_SIZE - 2,
          canvas.height / GRID_SIZE - 2
        );
      });

      // Draw food
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(
        food.x * (canvas.width / GRID_SIZE),
        food.y * (canvas.height / GRID_SIZE),
        canvas.width / GRID_SIZE - 2,
        canvas.height / GRID_SIZE - 2
      );
    },
    [snake, food]
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-white">Snake Game</h1>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-xl font-semibold text-white">Score: {score}</p>
        </div>
      </div>

      <canvas
        ref={draw}
        width={400}
        height={400}
        className="border-4 border-gray-700 rounded-lg shadow-xl"
      />

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          {isPaused ? <FaPlay /> : <FaPause />}
          {isPaused ? 'Resume (P)' : 'Pause (P)'}
        </button>

        <button
          onClick={resetGame}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <FaRedoAlt />
          Restart (R)
        </button>
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold text-red-500 mb-4">Game Over!</h2>
            <p className="text-2xl text-white mb-6">Final Score: {score}</p>
            <button
              onClick={resetGame}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
