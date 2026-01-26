import React, { useEffect } from "react";
import TradingViewWidget from "./TradingViewWidget";
import ParticipantList from "./ParticipantList";
import type { GameRound, UserMini } from "../types";
import { Bitcoin } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import confetti from "canvas-confetti";

interface Props {
  gameRound: GameRound;
}

const BADGE_COLORS = {
  1: "bg-red-600",
  2: "bg-gray-700",
  3: "bg-green-600",
};

const CHOICE_TEXTS = {
  1: "BEARISH",
  2: "NEUTRAL",
  3: "BULLISH",
};

const SettledRoundContents: React.FC<Props> = ({ gameRound }) => {
  const { user } = useOutletContext<{
    user: UserMini | null;
  }>();

  const participants = gameRound.predictions.map((pred) => ({
    userName: pred.user.name,
    choice: pred.choice,
  }));

  const savedChoice = user
    ? (gameRound.predictions.find((pred) => pred.user.name == user.name)
        ?.choice ?? null)
    : null;

  const userResult = savedChoice
    ? gameRound.winning_choice === savedChoice
      ? "Win"
      : "Lose"
    : "No Entry";

  const priceChange =
    ((gameRound.result_price! - gameRound.base_price) * 100) /
    gameRound.base_price;

  useEffect(() => {
    const fireConfetti = () => {
      confetti({
        particleCount: 250, // 粒の数
        spread: 150, // 広がり
        colors: ["#13e3fa", "#00ff26", "#fff459"], // UIに合わせた色
      });
    };

    if (userResult === "Win") fireConfetti();
  }, []);

  return (
    <div className="flex">
      <div className="w-full px-4">
        <div className="flex flex-col items-center my-4">
          {/* メインメッセージ */}
          {userResult === "Win" && (
            <>
              <p className="text-5xl font-bold my-5">Congrats! 🎉</p>
              <p className="text-3xl my-2">
                You Got{" "}
                <span className="text-amber-400 font-bold">100 Points!</span>
              </p>
            </>
          )}

          {userResult === "Lose" && (
            <>
              <p className="text-5xl text-cyan-700 font-bold my-5">Aww... 🫠</p>
              <p className="text-2xl my-2">... Better luck next time!</p>
            </>
          )}

          {userResult === "No Entry" && (
            <p className="text-5xl font-bold my-5">Round Summary</p>
          )}

          {/* 価格変化 */}
          <div
            className={`rounded-full font-bold px-7 mt-8
              ${BADGE_COLORS[gameRound.winning_choice!]}`}
          >
            {CHOICE_TEXTS[gameRound.winning_choice!]}
          </div>
          <div className="relative flex items-end gap-2 mt-1">
            <div className="flex">
              <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center mr-2">
                <Bitcoin className="w-5 h-5 stroke-2.5 text-white" />
              </div>
              <div className="text-xl">${gameRound.base_price}</div>
            </div>
            <div>{"->"}</div>
            <div className="text-4xl font-bold">${gameRound.result_price}</div>

            <div
              className={`absolute top-0 right-0 translate-x-15 -translate-y-1
              rounded text-sm px-1 py-0.5 font-bold
              ${BADGE_COLORS[gameRound.winning_choice!]}`}
            >
              {priceChange.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                signDisplay: "always",
              })}
              %
            </div>
          </div>

          <div className="mt-1 opacity-50">1/1 4:00 {"->"} 1/1 8:00 </div>
        </div>

        <TradingViewWidget />
      </div>

      <ParticipantList
        participants={participants}
        winningChoice={gameRound.winning_choice}
      />
    </div>
  );
};

export default SettledRoundContents;
