export interface Game {
  id: number;
  name: string;
  description: string;
  path: string;
  image: string;
  theme: string;
}

export const games: Game[] = [
  {
    id: 1,
    name: 'Game of Life',
    description:
      "Interactive cellular automation simulator based on Conway's rules. Watch complex patterns emerge from simple initial states.",
    path: '/games/game-of-life',
    image: '/games/life.jpg',
    theme: 'bg-indigo-500/20',
  },
  {
    id: 2,
    name: 'AI Tic Tac Toe',
    description:
      'Classic strategy game featuring an unbeatable Minimax algorithm opponent. Perfect your game theory skills.',
    path: '/games/tic-tac-toe',
    image: '/games/tic-tac-toe.jpg',
    theme: 'bg-rose-500/20',
  },
  {
    id: 3,
    name: 'AI Soccer',
    description:
      'Dynamic 1v1 soccer match against adaptive artificial intelligence. Master physics-based ball control and tactical gameplay.',
    path: '/games/soccer',
    image: '/games/soccer.jpg',
    theme: 'bg-emerald-500/20',
  },
  {
    id: 4,
    name: 'Snake',
    description:
      'Modern reinvention of the classic arcade experience with smooth controls and progressive difficulty scaling.',
    path: '/games/snake',
    image: '/games/snake.jpg',
    theme: 'bg-amber-500/20',
  },
];
