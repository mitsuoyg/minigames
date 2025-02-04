'use client';

import { useEffect, useRef, useState, useCallback, use } from 'react';
import { useInterval } from 'react-use';
import useGameSounds from '@/app/_hooks/useGameSounds';
import Vector from './_components/Vector';
import Camera from './_components/Camera';
import Entity from './_components/Entity';
import Physics from './_components/modules/Physics';
import Collision from './_components/modules/Collision';

const FIELD_WIDTH = 1000;
const GOAL_WIDTH = 50;
const GOAL_ASPECT = 0.4;
const FIELD_HEIGHT = 600;
const PLAYER_SIZE = 25;
const ITEM_WEIGHT = 10;
const NUM_PLAYERS = 2;
const BALL_SIZE = 15;
const WALL_WIDTH = 20;
const WALL_COLOR = '#333';
const PLAYER_SPEED = 5;
const BALL_SPEED = 5;

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
      const entity = new Entity(
        'player',
        new Vector(-FIELD_WIDTH / 4, 0),
        new Vector(PLAYER_SIZE, PLAYER_SIZE),
        [new Physics()],
        'blue'
      );
      entity.beforeUpdate = (entity, _) => {
        const velocity = new Vector(
          (keys.current['d'] ? 1 : 0) - (keys.current['a'] ? 1 : 0),
          (keys.current['s'] ? 1 : 0) - (keys.current['w'] ? 1 : 0)
        );
        entity.velocity = Vector.multiply(
          Vector.normalize(velocity),
          PLAYER_SPEED
        );
      };
      return entity;
    })()
  );
  const redPlayer = useRef<Entity>(
    (() => {
      const entity = new Entity(
        'redPlayer',
        new Vector(FIELD_WIDTH / 4, 0),
        new Vector(PLAYER_SIZE, PLAYER_SIZE),
        [new Physics()],
        'red'
      );
      entity.beforeUpdate = (entity, _) => {
        const velocity = new Vector(
          (keys.current['ArrowRight'] ? 1 : 0) -
            (keys.current['ArrowLeft'] ? 1 : 0),
          (keys.current['ArrowDown'] ? 1 : 0) -
            (keys.current['ArrowUp'] ? 1 : 0)
        );
        entity.velocity = Vector.multiply(
          Vector.normalize(velocity),
          PLAYER_SPEED
        );
      };
      entity.listeners.collision = (other_entity: Entity) => {
        console.log(other_entity.tag);
      };
      return entity;
    })()
  );

  const ball = useRef<Entity>(
    (() => {
      const entity = new Entity(
        'ball',
        new Vector(50, 0),
        new Vector(BALL_SIZE, BALL_SIZE),
        [new Physics('bounce')],
        '#fff'
      );
      entity.velocity = new Vector(BALL_SPEED, BALL_SPEED);
      return entity;
    })()
  );
  const blueGoal = useRef<Entity>(
    (() => {
      const entity = new Entity(
        'wall',
        new Vector(-FIELD_WIDTH / 2 - GOAL_WIDTH, 0),
        new Vector(ITEM_WEIGHT, FIELD_HEIGHT * GOAL_ASPECT + ITEM_WEIGHT),
        [new Collision()],
        'blue'
      );
      entity.on('collision', (other_entity: Entity) => {
        if (other_entity.tag === 'ball') {
          playGoal();
          setScores((prev) => ({ ...prev, red: prev.red + 1 }));
          resetGame();
        }
      });
      return entity;
    })()
  );
  const redGoal = useRef<Entity>(
    (() => {
      const entity = new Entity(
        'wall',
        new Vector(FIELD_WIDTH / 2 + GOAL_WIDTH, 0),
        new Vector(ITEM_WEIGHT, FIELD_HEIGHT * GOAL_ASPECT + ITEM_WEIGHT),
        [new Collision()],
        'red'
      );
      entity.on('collision', (other_entity: Entity) => {
        if (other_entity.tag === 'ball') {
          playGoal();
          setScores((prev) => ({ ...prev, blue: prev.blue + 1 }));
          resetGame();
        }
      });
      return entity;
    })()
  );

  const entities = useRef<Entity[]>([
    player.current,
    redPlayer.current,
    ball.current,
    redGoal.current,
    blueGoal.current,
    new Entity(
      'wall',
      new Vector(0, FIELD_HEIGHT / 2),
      new Vector(FIELD_WIDTH, ITEM_WEIGHT),
      [new Physics('static')],
      WALL_COLOR
    ),
    new Entity(
      'wall',
      new Vector(0, -FIELD_HEIGHT / 2),
      new Vector(FIELD_WIDTH, ITEM_WEIGHT),
      [new Physics('static')],
      WALL_COLOR
    ),
    new Entity(
      'wall',
      new Vector(
        -FIELD_WIDTH / 2,
        FIELD_HEIGHT / 2 - (FIELD_HEIGHT - FIELD_HEIGHT * GOAL_ASPECT) / 4
      ),
      new Vector(
        ITEM_WEIGHT,
        (FIELD_HEIGHT - FIELD_HEIGHT * GOAL_ASPECT) / 2 + ITEM_WEIGHT
      ),
      [new Physics('static')],
      WALL_COLOR
    ),
    // Left
    new Entity(
      'wall',
      new Vector(
        -FIELD_WIDTH / 2 - GOAL_WIDTH / 2,
        (-FIELD_HEIGHT * GOAL_ASPECT) / 2
      ),
      new Vector(GOAL_WIDTH, ITEM_WEIGHT),
      [new Physics('static')],
      WALL_COLOR
    ),
    new Entity(
      'wall',
      new Vector(
        -FIELD_WIDTH / 2 - GOAL_WIDTH / 2,
        (FIELD_HEIGHT * GOAL_ASPECT) / 2
      ),
      new Vector(GOAL_WIDTH, ITEM_WEIGHT),
      [new Physics('static')],
      WALL_COLOR
    ),
    new Entity(
      'wall',
      new Vector(
        -FIELD_WIDTH / 2,
        -FIELD_HEIGHT / 2 + (FIELD_HEIGHT - FIELD_HEIGHT * GOAL_ASPECT) / 4
      ),
      new Vector(
        ITEM_WEIGHT,
        (FIELD_HEIGHT - FIELD_HEIGHT * GOAL_ASPECT) / 2 + ITEM_WEIGHT
      ),
      [new Physics('static')],
      WALL_COLOR
    ),
    // Right
    new Entity(
      'wall',
      new Vector(
        FIELD_WIDTH / 2,
        FIELD_HEIGHT / 2 - (FIELD_HEIGHT - FIELD_HEIGHT * GOAL_ASPECT) / 4
      ),
      new Vector(
        ITEM_WEIGHT,
        (FIELD_HEIGHT - FIELD_HEIGHT * GOAL_ASPECT) / 2 + ITEM_WEIGHT
      ),
      [new Physics('static')],
      WALL_COLOR
    ),
    new Entity(
      'wall',
      new Vector(
        FIELD_WIDTH / 2 + GOAL_WIDTH / 2,
        (-FIELD_HEIGHT * GOAL_ASPECT) / 2
      ),
      new Vector(GOAL_WIDTH, ITEM_WEIGHT),
      [new Physics('static')],
      WALL_COLOR
    ),
    new Entity(
      'wall',
      new Vector(
        FIELD_WIDTH / 2 + GOAL_WIDTH / 2,
        (FIELD_HEIGHT * GOAL_ASPECT) / 2
      ),
      new Vector(GOAL_WIDTH, ITEM_WEIGHT),
      [new Physics('static')],
      WALL_COLOR
    ),
    new Entity(
      'wall',
      new Vector(
        FIELD_WIDTH / 2,
        -FIELD_HEIGHT / 2 + (FIELD_HEIGHT - FIELD_HEIGHT * GOAL_ASPECT) / 4
      ),
      new Vector(
        ITEM_WEIGHT,
        (FIELD_HEIGHT - FIELD_HEIGHT * GOAL_ASPECT) / 2 + ITEM_WEIGHT
      ),
      [new Physics('static')],
      WALL_COLOR
    ),
  ]);

  const playHit = () => playSound(523.25, 0.1);
  const playGoal = () => playSound(1046.5, 0.5);

  const resetGame = () => {
    player.current.position = new Vector(-FIELD_WIDTH / 4, 0);
    redPlayer.current.position = new Vector(FIELD_WIDTH / 4, 0);
    ball.current.position = new Vector(50, 0);
    ball.current.velocity = new Vector(BALL_SPEED, BALL_SPEED);
  };

  const resetAll = () => {};

  useEffect(() => {
    const handleKeyEvent = (e: KeyboardEvent, isPressed: boolean) => {
      keys.current = { ...keys.current, [e.key]: isPressed };
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

      canvasRef.current.width = camera.current.size.x + 200;
      canvasRef.current.height = camera.current.size.y + 200;
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
