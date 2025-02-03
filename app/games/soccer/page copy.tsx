'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInterval } from 'react-use';

const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;
const PLAYER_SIZE = 20;
const NUM_PLAYERS = 2;
const BALL_SIZE = 15;
const GOAL_WIDTH = 100;
const WALL_WIDTH = 20;

interface Vector {
  x: number;
  y: number;
}

interface Ball extends Vector {
  dx: number;
  dy: number;
}

interface Player extends Vector {
  team: 'blue' | 'red';
  controlled: boolean;
}

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
    playHit: () => playSound(523.25, 0.1),
    playGoal: () => playSound(1046.5, 0.5),
  };
};

export default function GamePage() {
  const { playHit, playGoal } = useGameSounds();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scores, setScores] = useState({ blue: 0, red: 0 });
  const [isPaused, setIsPaused] = useState(true);
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
  const gameState = useRef<{
    ball: Ball;
    players: Player[];
    lastTime: number | null;
  }>({
    ball: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2, dx: 5, dy: 5 },
    players: [],
    lastTime: null,
  });

  // Initialize game state
  useEffect(() => {
    const players: Player[] = [];
    // Blue team
    for (let i = 0; i < NUM_PLAYERS / 2; i++) {
      players.push({
        x: 100 + i * 50,
        y: FIELD_HEIGHT / 2 + (i % 2 ? -50 : 50),
        team: 'blue',
        controlled: i === 0,
      });
    }
    // Red team
    for (let i = 0; i < NUM_PLAYERS / 2; i++) {
      players.push({
        x: FIELD_WIDTH - 100 - i * 50,
        y: FIELD_HEIGHT / 2 + (i % 2 ? -50 : 50),
        team: 'red',
        controlled: false,
      });
    }
    gameState.current.players = players;
  }, []);

  const movePlayer = useCallback((player: Player, dx: number, dy: number) => {
    player.x = Math.max(
      PLAYER_SIZE,
      Math.min(FIELD_WIDTH - PLAYER_SIZE, player.x + dx)
    );
    player.y = Math.max(
      PLAYER_SIZE,
      Math.min(FIELD_HEIGHT - PLAYER_SIZE, player.y + dy)
    );
  }, []);

  const updateAiPlayers = useCallback(
    (ball: Ball) => {
      gameState.current.players.forEach((player) => {
        if (player.controlled) return;

        // Calculate intercept point
        const dxToBall = ball.x - player.x;
        const dyToBall = ball.y - player.y;
        const distanceToBall = Math.sqrt(dxToBall ** 2 + dyToBall ** 2);
        const speed = 3;

        // normalize
        const strategy = 'go-to-ball';
        if (strategy === 'go-to-ball' && distanceToBall > 0) {
          movePlayer(
            player,
            (dxToBall / distanceToBall) * speed,
            (dyToBall / distanceToBall) * speed
          );
        }

        // const timeToIntercept = distanceToBall / 3;

        // const targetX = ball.x + ball.dx * timeToIntercept;
        // const targetY = ball.y + ball.dy * timeToIntercept;

        // Stay in defensive position when ball is far
        // const isAttacking = false;
        // const isAttacking =
        //   player.team === 'blue'
        //     ? ball.x > FIELD_WIDTH / 2
        //     : ball.x < FIELD_WIDTH / 2;

        // const finalTarget = isAttacking
        //   ? { x: targetX, y: targetY }
        //   : { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 };

        // const dx = finalTarget.x - player.x;
        // const dy = finalTarget.y - player.y;
        // const distance = Math.sqrt(dx ** 2 + dy ** 2);
      });
    },
    [movePlayer]
  );

  const checkCollisions = useCallback(() => {
    const { ball, players } = gameState.current;
    const ballRadius = BALL_SIZE / 2;

    // Ball-wall collisions
    if (ball.y - ballRadius <= 0 || ball.y + ballRadius >= FIELD_HEIGHT) {
      ball.dy *= -1;
      playHit();
    }

    // Goal collisions
    const blueGoal = {
      x: 0,
      y: FIELD_HEIGHT / 2 - GOAL_WIDTH / 2,
      width: WALL_WIDTH,
      height: GOAL_WIDTH,
    };
    const redGoal = {
      x: FIELD_WIDTH - WALL_WIDTH,
      y: FIELD_HEIGHT / 2 - GOAL_WIDTH / 2,
      width: WALL_WIDTH,
      height: GOAL_WIDTH,
    };

    const ballRect = {
      x: ball.x - ballRadius,
      y: ball.y - ballRadius,
      width: BALL_SIZE,
      height: BALL_SIZE,
    };

    const checkGoalCollision = (goal: typeof blueGoal) => {
      return (
        ballRect.x < goal.x + goal.width &&
        ballRect.x + ballRect.width > goal.x &&
        ballRect.y < goal.y + goal.height &&
        ballRect.y + ballRect.height > goal.y
      );
    };

    if (checkGoalCollision(blueGoal)) {
      setScores((s) => ({ ...s, red: s.red + 1 }));
      resetBall();
      playGoal();
      return;
    }

    if (checkGoalCollision(redGoal)) {
      setScores((s) => ({ ...s, blue: s.blue + 1 }));
      resetBall();
      playGoal();
      return;
    }

    // Side walls
    if (ball.x - ballRadius <= 0 || ball.x + ballRadius >= FIELD_WIDTH) {
      ball.dx *= -1;
      playHit();
    }

    // Player-ball collisions
    players.forEach((player) => {
      const playerRect = {
        x: player.x - PLAYER_SIZE / 2,
        y: player.y - PLAYER_SIZE / 2,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
      };

      // Find closest point on player rect to ball center
      const closestX = Math.max(
        playerRect.x,
        Math.min(ball.x, playerRect.x + playerRect.width)
      );
      const closestY = Math.max(
        playerRect.y,
        Math.min(ball.y, playerRect.y + playerRect.height)
      );

      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      const distanceSquared = dx ** 2 + dy ** 2;

      if (distanceSquared < ballRadius ** 2) {
        const distance = Math.sqrt(distanceSquared);
        const nx = dx / distance;
        const ny = dy / distance;

        // Reflect ball velocity
        const dot = ball.dx * nx + ball.dy * ny;
        ball.dx = ball.dx - 2 * dot * nx;
        ball.dy = ball.dy - 2 * dot * ny;

        // Add velocity boost
        ball.dx *= 1.1;
        ball.dy *= 1.1;

        playHit();
      }
    });
  }, [playHit, playGoal]);

  const resetBall = () => {
    gameState.current.ball = {
      x: FIELD_WIDTH / 2,
      y: FIELD_HEIGHT / 2,
      dx: 5 * (Math.random() > 0.5 ? 1 : -1),
      dy: 5 * (Math.random() > 0.5 ? 1 : -1),
    };
  };

  const gameLoop = useCallback(() => {
    if (!canvasRef.current || isPaused) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { ball } = gameState.current;

    // Move controlled player
    const controlledPlayer = gameState.current.players.find(
      (p) => p.controlled
    );
    if (controlledPlayer) {
      if (keys.w) movePlayer(controlledPlayer, 0, -5);
      if (keys.s) movePlayer(controlledPlayer, 0, 5);
      if (keys.a) movePlayer(controlledPlayer, -5, 0);
      if (keys.d) movePlayer(controlledPlayer, 5, 0);
    }

    updateAiPlayers(ball);

    ball.x += ball.dx;
    ball.y += ball.dy;

    checkCollisions();

    // Draw
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    // Draw goals
    ctx.fillStyle = '#4299e1';
    ctx.fillRect(0, FIELD_HEIGHT / 2 - GOAL_WIDTH / 2, WALL_WIDTH, GOAL_WIDTH);
    ctx.fillStyle = '#f56565';
    ctx.fillRect(
      FIELD_WIDTH - WALL_WIDTH,
      FIELD_HEIGHT / 2 - GOAL_WIDTH / 2,
      WALL_WIDTH,
      GOAL_WIDTH
    );

    // Draw players
    gameState.current.players.forEach((player) => {
      ctx.fillStyle = player.team === 'blue' ? '#4299e1' : '#f56565';
      ctx.beginPath();
      ctx.roundRect(
        player.x - PLAYER_SIZE / 2,
        player.y - PLAYER_SIZE / 2,
        PLAYER_SIZE,
        PLAYER_SIZE,
        4
      );
      ctx.fill();
    });

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [isPaused, keys, checkCollisions, updateAiPlayers, movePlayer]);

  useInterval(gameLoop, 20);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, value: boolean) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys((k) => ({ ...k, w: value }));
          break;
        case 'a':
          setKeys((k) => ({ ...k, a: value }));
          break;
        case 's':
          setKeys((k) => ({ ...k, s: value }));
          break;
        case 'd':
          setKeys((k) => ({ ...k, d: value }));
          break;
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'p':
          setIsPaused(!isPaused);
          break;
        case 'r':
          resetBall();
          setScores({ blue: 0, red: 0 });
          break;
      }
    };

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup', (e) => handleKey(e, false));
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [isPaused]);

  return (
    <div className="relative bg-gray-900 min-h-screen flex items-center justify-center">
      {/* UI elements remain the same */}
      <div className="absolute top-4 left-4 text-white flex gap-4">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700"
        >
          {isPaused ? 'Resume (P)' : 'Pause (P)'}
        </button>
        <button
          onClick={() => {
            resetBall();
            setScores({ blue: 0, red: 0 });
          }}
          className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700"
        >
          Restart (R)
        </button>
      </div>

      <div className="absolute top-4 right-4 text-2xl text-white">
        <div className="text-blue-400">Blue: {scores.blue}</div>
        <div className="text-red-400">Red: {scores.red}</div>
      </div>

      <canvas
        ref={canvasRef}
        width={FIELD_WIDTH}
        height={FIELD_HEIGHT}
        className="border-4 border-gray-800 rounded-lg"
      />
    </div>
  );
}
