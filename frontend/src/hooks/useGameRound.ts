import { useEffect, useState } from "react";
import type { GameRound, GameRoundRaw } from "../types";
import axios from "axios";

export const useGameRound = (id: string) => {
  const [gameRound, setGameRound] = useState<GameRound | null>(null);

  const fetchGameRound = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get<GameRoundRaw>(
        `${apiUrl}/game_rounds/${id}`,
      );
      const raw = response.data;
      const formattedGameRound: GameRound = {
        ...raw,
        start_at: new Date(raw.start_at),
        closed_at: new Date(raw.closed_at),
        target_at: new Date(raw.target_at),
      };
      setGameRound(formattedGameRound);
    } catch (error) {
      console.error("ラウンド取得に失敗:", error);
    }
  };

  useEffect(() => {
    if (!id) return;
    setGameRound(null);
    fetchGameRound();
  }, [id]);

  return { gameRound, setGameRound, reFetchGameRound: fetchGameRound };
};
