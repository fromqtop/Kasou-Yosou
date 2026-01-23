import React, { useEffect, useState } from "react";
import PriceDisplay from "../components/PriceDisplay";
import TradingViewWidget from "../components/TradingViewWidget";
import { useOutletContext, useParams } from "react-router-dom";
import type { PredictionCreateResponse, UserMini } from "../types";
import axios from "axios";
import dayjs from "dayjs";
import { useGameRound } from "../hooks/useGameRound";
import PredictionButtonGroup from "../components/PredictionButtonGroup";

const GameRoundPage: React.FC = () => {
  const { id } = useParams();
  const { gameRound } = useGameRound(id ?? "");
  const { user, refetchUser } = useOutletContext<{
    user: UserMini | null;
    refetchUser: () => void;
  }>();
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userChoice =
      gameRound?.predictions.find(
        (prediction) => prediction.user.name == user?.name,
      )?.choice ?? null;

    setSelected(userChoice);
  }, [gameRound]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const savedUid = localStorage.getItem("uid");
      if (!selected) return;

      const apiUrl = import.meta.env.VITE_API_URL;
      const payload = {
        user_uid: savedUid,
        choice: selected,
      };

      await axios.post<PredictionCreateResponse>(
        `${apiUrl}/game_rounds/${gameRound?.id}/predictions`,
        payload,
      );

      alert("予想を登録しました！");
      refetchUser();
    } catch (error) {
      alert("登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {gameRound ? (
        <div className="flex flex-col items-center w-full gap-4">
          <PriceDisplay
            price={gameRound.base_price}
            startAt={gameRound.start_at}
          />

          <TradingViewWidget />

          <p className="text-4xl font-bold">Bull or Bear?</p>
          <p>
            How will the{" "}
            <span className="underline">
              price at {dayjs(gameRound.target_at).format("HH:mm")}
            </span>{" "}
            compare to {dayjs(gameRound.start_at).format("HH:mm")} ?
          </p>

          <PredictionButtonGroup
            basePrice={gameRound.base_price}
            selected={selected}
            setSelected={setSelected}
          />

          <button
            className="px-8 py-3 font-bold
            border rounded-md border-indigo-700
            bg-indigo-900/50 hover:bg-indigo-900/70 active:bg-indigo-900 transition
            cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting || !selected}
          >
            SUBMIT - Cost 100 pts
          </button>
        </div>
      ) : (
        <div>Loading ...</div>
      )}
    </>
  );
};

export default GameRoundPage;
