import { createContext, useContext, ReactNode } from "react";
import { useEpisodeDayUnlock, type UnlockInfo, type EpisodeDayState } from "@/hooks/useEpisodeDayUnlock";

interface Ctx {
  chapterId: string;
  episodeId: string;
  isLoading: boolean;
  info: UnlockInfo;
  setDayState: (patch: Partial<EpisodeDayState>) => Promise<EpisodeDayState>;
  isSaving: boolean;
}

const EpisodeDayContext = createContext<Ctx | null>(null);

export const EpisodeDayProvider = ({
  chapterId,
  episodeId,
  children,
}: {
  chapterId: string;
  episodeId: string;
  children: ReactNode;
}) => {
  const { isLoading, info, setDayState, isSaving } = useEpisodeDayUnlock(chapterId, episodeId);
  return (
    <EpisodeDayContext.Provider value={{ chapterId, episodeId, isLoading, info, setDayState, isSaving }}>
      {children}
    </EpisodeDayContext.Provider>
  );
};

export const useEpisodeDay = () => {
  const ctx = useContext(EpisodeDayContext);
  if (!ctx) throw new Error("useEpisodeDay must be used inside EpisodeDayProvider");
  return ctx;
};
