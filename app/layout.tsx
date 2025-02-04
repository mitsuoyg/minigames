import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { FaGithub } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Mitsuo | Minigames',
  description: 'A collection of fun and interactive minigames.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="flex py-4 px-8 align-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold">Minigames</h1>
          </Link>
          <div className="flex">
            <Link
              href="https://github.com/mitsuoyg/minigames"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-black dark:text-white cursor-pointer flex items-center"
            >
              <FaGithub size={24} />
            </Link>
            <Link
              href="https://mitsuo.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-black dark:text-white cursor-pointer flex items-center"
            >
              <Image src="/logo.png" alt="About Me" width={24} height={24} />
            </Link>
          </div>
        </header>
        {children}

        <footer className="p-4 text-center">
          <p className="text-slate-400">
            Created by{' '}
            <Link href="https://mitsuo.vercel.app/" target="_blank">
              <span className="font-semibold text-cyan-400">Mitsuo</span>
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
