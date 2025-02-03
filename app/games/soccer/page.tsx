'use client';

import { useEffect, useRef, useState, useCallback, use } from 'react';
import { useInterval } from 'react-use';
import useGameSounds from '@/app/_hooks/useGameSounds';
import Vector from './_components/Vector';
import Camera from './_components/Camera';
import Entity from './_components/Entity';

const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;
const PLAYER_SIZE = 20;
const NUM_PLAYERS = 2;
const BALL_SIZE = 15;
const GOAL_WIDTH = 100;
const WALL_WIDTH = 20;

export default function GamePage() {
  const { playSound } = useGameSounds();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scores, setScores] = useState({ blue: 0, red: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const keys = useRef<{ [key: string]: boolean }>({});
  const camera = useRef(
    new Camera(Vector.zero(), new Vector(FIELD_WIDTH, FIELD_HEIGHT))
  );
  const player = useRef<Entity>(
    (() => {
      const entity = new Entity('player', Vector.zero(), new Vector(40, 40));
      const speed = 8;
      entity.beforeUpdate = (entity, _) => {
        let velocity = Vector.zero();
        if (keys.current['a']) {
          velocity.x = -1;
        }
        if (keys.current['d']) {
          velocity.x = 1;
        }
        if (keys.current['w']) {
          velocity.y = -1;
        }
        if (keys.current['s']) {
          velocity.y = 1;
        }
        let normalized = Vector.normalize(velocity);
        entity.velocity = Vector.multiply(normalized, speed);
      };
      return entity;
    })()
  );
  const entities = useRef<Entity[]>([player.current]);

  const playHit = () => playSound(523.25, 0.1);
  const playGoal = () => playSound(1046.5, 0.5);

  const resetAll = () => {};

  useEffect(() => {
    const handleKeyEvent = (e: KeyboardEvent, isPressed: boolean) => {
      if (['w', 's', 'a', 'd'].includes(e.key)) {
        keys.current = { ...keys.current, [e.key]: isPressed };
      }
    };

    const keyDownHandler = (e: KeyboardEvent) => handleKeyEvent(e, true);
    const keyUpHandler = (e: KeyboardEvent) => handleKeyEvent(e, false);

    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, []);

  const gameLoop = () => {
    const draw = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      canvasRef.current.width = camera.current.size.x;
      canvasRef.current.height = camera.current.size.y;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      entities.current.forEach((entity) => {
        ctx.fillStyle = entity.color;
        if (canvasRef.current) {
          ctx.fillRect(
            canvasRef.current.width / 2 +
              (entity.position.x - entity.size.x / 2) -
              camera.current.position.x,
            canvasRef.current.height / 2 +
              (entity.position.y - entity.size.y / 2) -
              camera.current.position.y,
            entity.size.x,
            entity.size.y
          );
        }
      });
    };
    const beforeUpdate = () => {
      entities.current.forEach((entity) => {
        entity._beforeUpdate(entities.current);
      });
    };
    const update = () => {
      entities.current.forEach((entity) => {
        entity._update(entities.current);
      });
    };

    draw();
    beforeUpdate();
    update();
  };

  useInterval(gameLoop, 20);

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
            resetAll();
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
