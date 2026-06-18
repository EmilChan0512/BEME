import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type GlobalBgmContextValue = {
  isPlaying: boolean;
  statusText: string;
  togglePlayback: () => void;
};

type GlobalBgmProviderProps = {
  children: ReactNode;
};

const AURORA_BGM_URL = `${import.meta.env.BASE_URL}audio/6211923-1-208.mp3`;
const AURORA_BGM_VOLUME = 0.42;

const GlobalBgmContext = createContext<GlobalBgmContextValue | null>(null);

export function GlobalBgmProvider({ children }: GlobalBgmProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusText, setStatusText] = useState('Music ready. Click to play.');

  useEffect(() => {
    // 全局只创建一个 audio 实例，这样切路由时音乐不会因为页面组件卸载而中断。
    const audio = new Audio(AURORA_BGM_URL);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = AURORA_BGM_VOLUME;
    audioRef.current = audio;

    const handlePlay = () => {
      setIsPlaying(true);
      setStatusText('Now playing in loop.');
    };
    const handlePause = () => {
      setIsPlaying(false);
      setStatusText('Music paused.');
    };
    const handleCanPlay = () => {
      if (!audio.paused) {
        return;
      }

      setStatusText('Music ready. Click to play.');
    };
    const handleError = () => {
      setIsPlaying(false);
      setStatusText('Music load failed. Check local asset path.');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, []);

  const value = useMemo<GlobalBgmContextValue>(
    () => ({
      isPlaying,
      statusText,
      togglePlayback: () => {
        const audio = audioRef.current;

        if (!audio) {
          setStatusText('Music not initialized yet.');
          return;
        }

        if (audio.paused) {
          void audio.play().catch(() => {
            setIsPlaying(false);
            setStatusText('Playback blocked. Click again after interaction.');
          });
          return;
        }

        audio.pause();
      },
    }),
    [isPlaying, statusText],
  );

  return <GlobalBgmContext.Provider value={value}>{children}</GlobalBgmContext.Provider>;
}

export function useGlobalBgm() {
  const context = useContext(GlobalBgmContext);

  if (!context) {
    throw new Error('useGlobalBgm must be used within GlobalBgmProvider');
  }

  return context;
}
