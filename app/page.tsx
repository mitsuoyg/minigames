import Image from 'next/image';
import Link from 'next/link';
import { games } from './data/game';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8 sm:p-12 md:p-16">
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Next-Gen Gaming Hub
        </h1>
        <p className="mt-4 text-lg text-slate-300 md:text-xl">
          Choose your immersive experience
        </p>
      </header>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
        {games.map((game) => (
          <Link
            key={game.id}
            href={game.path}
            className="group relative overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-105"
          >
            <div className={`absolute inset-0 ${game.theme} opacity-50`} />
            <div className="relative aspect-square w-full">
              <Image
                src={game.image}
                alt={game.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <h3 className="text-2xl font-bold text-white">{game.name}</h3>
              <p className="mt-2 text-center text-slate-200">
                {game.description}
              </p>
              <button className="mt-4 rounded-lg bg-cyan-400 px-6 py-2 font-semibold text-slate-900 transition-colors hover:bg-cyan-300">
                Play Now →
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
              <h3 className="text-xl font-semibold text-white">{game.name}</h3>
            </div>
          </Link>
        ))}
      </div>

      <footer className="mt-16 text-center">
        <p className="text-slate-400">
          Powered by{' '}
          <span className="font-semibold text-cyan-400">Next.js Gaming</span>
        </p>
      </footer>
    </div>
  );
}
