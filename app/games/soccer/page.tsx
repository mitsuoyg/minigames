'use client';

import { useEffect, useRef, useState } from 'react';
import { useInterval } from 'react-use';
// import {
//   FaCrosshairs,
//   FaShieldAlt,
//   FaHourglassStart,
//   FaExchangeAlt,
//   FaBullseye,
//   FaCube,
// } from 'react-icons/fa';
import useGameSounds from '@/app/_hooks/useGameSounds';
import Vector from './_components/Vector';
import Camera from './_components/Camera';
import Entity from './_components/Entity';
import Physics from './_components/modules/Physics';
import Collision from './_components/modules/Collision';

const FIELD_WIDTH = 1000;
const GOAL_WIDTH = 24;
const GOAL_ASPECT = 0.3;
const FIELD_HEIGHT = 600;
const PLAYER_SIZE = 16;
const ITEM_WEIGHT = 12;
const BALL_SIZE = 8;
const WALL_COLOR = '#333';
const PLAYER_SPEED = 3;
const BALL_SPEED = 3;
const BALL_SPEED_MAX = 10;

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
      entity.team = 'blue';
      entity.beforeUpdate = (entity) => {
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
  const AIPlayerFactory = (team: string, position: Vector) => {
    const entity = new Entity(
      `${team}-player`,
      position,
      new Vector(PLAYER_SIZE, PLAYER_SIZE),
      [new Physics()],
      team
    );
    entity.team = team;
    entity.beforeUpdate = (entity) => {
      if (
        !entity.timeCount ||
        !entity.timeLimit ||
        entity.timeCount > entity.timeLimit
      ) {
        const strategies = [
          'attacking',
          'intercepting',
          'defending',
          'goalkeeper',
          'covering',
        ];
        entity.strategy =
          strategies[Math.floor(Math.random() * strategies.length)];
        entity.timeCount = 1;
        entity.timeLimit = 200 + Math.floor(Math.random() * 200);
      }
      entity.timeCount = Number(entity.timeCount) + 1;

      let target = Vector.zero();
      const strategy = entity.strategy || 'attacking';
      const myGoal = team === 'red' ? redGoal.current : blueGoal.current;
      const opponentTeam = team === 'red' ? 'blue' : 'red';

      if (strategy === 'attacking') {
        target = new Vector(ball.current.position.x, ball.current.position.y);
      } else if (strategy === 'defending') {
        target = new Vector(
          (ball.current.position.x + myGoal.position.x) / 2,
          ball.current.position.y
        );
      } else if (strategy === 'goalkeeper') {
        const targetX =
          team === 'red'
            ? Math.max(ball.current.position.x, myGoal.position.x - 100)
            : Math.min(ball.current.position.x, myGoal.position.x + 100);
        target = new Vector(
          targetX,
          Math.max(Math.min(ball.current.position.y, 150), -150)
        );
      } else if (strategy === 'covering') {
        const nearestOpponent = entities.current
          .filter((e) => e.team === opponentTeam)
          .sort(
            (a, b) =>
              Vector.distance(entity.position, a.position) -
              Vector.distance(entity.position, b.position)
          )[0];
        target = nearestOpponent?.position || myGoal.position;
      } else if (strategy === 'intercepting') {
        const ballPrediction = Vector.add(
          ball.current.position,
          Vector.multiply(ball.current.velocity, 30)
        );
        target = ballPrediction;
      }
      const directionVector = Vector.subtract(target, entity.position);
      const direction = Vector.normalize(directionVector);
      entity.velocity = Vector.multiply(direction, PLAYER_SPEED);
    };
    return entity;
  };
  const redPlayers = useRef<Entity[]>(
    (() => {
      const originX = FIELD_WIDTH / 4;
      const positions = [
        new Vector(originX, 0),
        new Vector(originX, 20),
        new Vector(originX, -20),
        new Vector(originX - 20, 0),
        new Vector(originX + 20, 0),
      ];
      const entities = positions.map((position) =>
        AIPlayerFactory('red', position)
      );
      return entities;
    })()
  );
  const bluePlayers = useRef<Entity[]>(
    (() => {
      const originX = -FIELD_WIDTH / 4;
      const positions = [
        new Vector(originX, 20),
        new Vector(originX, -20),
        new Vector(originX - 20, 0),
        new Vector(originX + 20, 0),
      ];
      const entities = positions.map((position) =>
        AIPlayerFactory('blue', position)
      );
      return entities;
    })()
  );

  // const redPlayer_ = useRef<Entity>(
  //   (() => {
  //     const entity = new Entity(
  //       'redPlayer',
  //       new Vector(FIELD_WIDTH / 4, 0),
  //       new Vector(PLAYER_SIZE, PLAYER_SIZE),
  //       [new Physics()],
  //       'red'
  //     );
  //     entity.beforeUpdate = (entity, _) => {
  //       const velocity = new Vector(
  //         (keys.current['ArrowRight'] ? 1 : 0) -
  //           (keys.current['ArrowLeft'] ? 1 : 0),
  //         (keys.current['ArrowDown'] ? 1 : 0) -
  //           (keys.current['ArrowUp'] ? 1 : 0)
  //       );
  //       entity.velocity = Vector.multiply(
  //         Vector.normalize(velocity),
  //         PLAYER_SPEED
  //       );
  //     };
  //     return entity;
  //   })()
  // );

  const ball = useRef<Entity>(
    (() => {
      const entity = new Entity(
        'ball',
        new Vector(0, 0),
        new Vector(BALL_SIZE, BALL_SIZE),
        [new Physics('bounce')],
        '#fff'
      );
      entity.interval = 0;
      entity.beforeUpdate = (entity) => {
        entity.interval = Number(entity.interval) + 1;
        if (entity.interval >= 100) {
          if (Math.abs(entity.velocity.x) < BALL_SPEED_MAX) {
            entity.velocity = Vector.multiply(entity.velocity, 1.02);
          }
          entity.interval = 0;
        }
      };
      return entity;
    })()
  );

  useEffect(() => {
    if (ball.current) {
      resetGame();
    }
  }, [ball]);

  const blueGoal = useRef<Entity>(
    (() => {
      const entity = new Entity(
        'wall',
        new Vector(-FIELD_WIDTH / 2 - 20, 0),
        new Vector(GOAL_WIDTH, FIELD_HEIGHT * GOAL_ASPECT + ITEM_WEIGHT),
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
        new Vector(FIELD_WIDTH / 2 + 20, 0),
        new Vector(GOAL_WIDTH, FIELD_HEIGHT * GOAL_ASPECT + ITEM_WEIGHT),
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
    ...redPlayers.current,
    ...bluePlayers.current,
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
    // Left
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

  // const playHit = () => playSound(523.25, 0.1);
  const playGoal = () => playSound(1046.5, 0.4);

  const resetGame = () => {
    ball.current.position = new Vector(0, 0);
    ball.current.velocity = new Vector(
      (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED,
      (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED
    );
  };

  const resetAll = () => {
    setScores({ blue: 0, red: 0 });
    resetGame();
  };

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
    if (isPaused) return;

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
      <div className="absolute top-4 left-4 text-white flex gap-4 bg-gray-800/50 p-4 rounded-lg">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="bg-emerald-600 px-4 py-2 rounded hover:bg-emerald-700 transition-all"
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          onClick={resetAll}
          className="bg-rose-600 px-4 py-2 rounded hover:bg-rose-700 transition-all"
        >
          ↻ Restart
        </button>
      </div>

      <div className="absolute top-4 right-4 text-2xl text-white bg-gray-800/50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-blue-400 font-bold">{scores.blue}</div>
          <div className="text-gray-300">-</div>
          <div className="text-red-400 font-bold">{scores.red}</div>
        </div>
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
