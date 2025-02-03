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
      "Interactive cellular automation simulator based on Conway's rules",
    path: '/games/game-of-life',
    image: '/games/life.PNG',
    theme: 'bg-indigo-500/20',
  },
  {
    id: 2,
    name: 'AI Tic Tac Toe',
    description:
      'Classic strategy game featuring an unbeatable Minimax algorithm opponent.',
    path: '/games/tic-tac-toe',
    image: '/games/tic-tac-toe.PNG',
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
      'Classic arcade experience with progressive difficulty scaling.',
    path: '/games/snake',
    image: '/games/snake.PNG',
    theme: 'bg-amber-500/20',
  },
];
