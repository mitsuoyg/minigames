import { useEffect, useRef } from 'react';

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

  return { playSound };
};

export default useGameSounds;
