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
  const { gameRound, reFetchGameRound } = useGameRound(id ?? "");
  const { user, refetchUser } = useOutletContext<{
    user: UserMini | null;
    refetchUser: () => void;
  }>();
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ユーザーが登録済の選択肢
  const userChoice =
    gameRound?.predictions.find(
      (prediction) => prediction.user.name == user?.name,
    )?.choice ?? null;

  useEffect(() => {
    if (!gameRound) return;
    // ユーザーの選択値をDBデータで更新
    setSelected(userChoice);

    // タイマー
    const updateTimer = () => {
      const now = dayjs();
      const target = dayjs(gameRound.closed_at);
      const diff = target.diff(now); // ミリ秒単位の差分

      if (diff <= 0) {
        setTimeLeft("00:00");
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const padMin = String(minutes).padStart(2, "0");
      const padSec = String(seconds).padStart(2, "0");
      setTimeLeft(`${padMin}:${padSec}`);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
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

      // ゲームデータ最新化・ポイント更新
      reFetchGameRound();
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
          <div className="w-full flex gap-5 justify-start">
            <div className="font-bold">Round #{gameRound.id}</div>
            <div>Ends in {timeLeft}</div>
          </div>

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
            disabled={isSubmitting || !selected || userChoice === selected}
          >
            {!userChoice ? "SUBMIT - Cost 100 pts" : "UPDATE CHOICE"}
          </button>
        </div>
      ) : (
        <div>Loading ...</div>
      )}
    </>
  );
};

export default GameRoundPage;
