import React, { useState } from "react";
import PriceDisplay from "./PriceDisplay";
import TradingViewWidget from "./TradingViewWidget";
import PredictionButtonGroup from "./PredictionButtonGroup";
import ParticipantList from "./ParticipantList";
import type { GameRound, PredictionCreateResponse, UserMini } from "../types";
import dayjs from "dayjs";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

interface Props {
  gameRound: GameRound;
  reFetchGameRound: () => void;
}

const ActiveRoundContents: React.FC<Props> = ({
  gameRound,
  reFetchGameRound,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refetchUser } = useOutletContext<{
    user: UserMini | null;
    refetchUser: () => void;
  }>();

  const handleSubmit = async () => {
    if (!selectedChoice) return;

    setIsSubmitting(true);
    try {
      const savedUid = localStorage.getItem("uid");
      const apiUrl = import.meta.env.VITE_API_URL;
      const payload = {
        user_uid: savedUid,
        choice: selectedChoice,
      };

      await axios.post<PredictionCreateResponse>(
        `${apiUrl}/game_rounds/${gameRound?.id}/predictions`,
        payload,
      );

      alert("予想を登録しました！");
      reFetchGameRound();
      refetchUser();
    } catch (error) {
      alert("登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const savedChoice = user
    ? (gameRound.predictions.find((pred) => pred.user.name == user.name)
        ?.choice ?? null)
    : null;

  const currentChoice = selectedChoice || savedChoice;

  const participants = gameRound.predictions.map((pred) => ({
    userName: pred.user.name,
    choice: pred.choice,
  }));

  return (
    <div className="flex">
      <div className="px-4 flex flex-col items-center w-full gap-4">
        <PriceDisplay
          price={gameRound.base_price}
          startAt={gameRound.start_at}
        />

        <TradingViewWidget />

        <p className="text-xl">
          How will the{" "}
          <span className="underline">
            price at {dayjs(gameRound.target_at).format("HH:mm")}
          </span>{" "}
          compare to {dayjs(gameRound.start_at).format("HH:mm")} ?
        </p>

        <PredictionButtonGroup
          basePrice={gameRound.base_price}
          selectedChoice={currentChoice}
          setSelectedChoice={setSelectedChoice}
        />

        <button
          className="px-8 py-3 font-bold
            border rounded-md border-indigo-700
            bg-indigo-900/50 hover:bg-indigo-900/70 active:bg-indigo-900 transition
            cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSubmit}
          disabled={
            isSubmitting || !selectedChoice || selectedChoice === savedChoice
          }
        >
          {!savedChoice ? "SUBMIT - Cost 100 pts" : "UPDATE CHOICE"}
        </button>
      </div>

      <ParticipantList participants={participants} />
    </div>
  );
};

export default ActiveRoundContents;
