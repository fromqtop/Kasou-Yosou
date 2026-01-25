import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGameRound } from "../hooks/useGameRound";
import ActiveRoundContents from "../components/ActiveRoundContents";
import SettledRoundContents from "../components/SettledRoundContents";
import dayjs from "dayjs";

const GameRoundPage: React.FC = () => {
  const { id } = useParams();
  const { gameRound, reFetchGameRound, isLoading } = useGameRound(id!);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = (closedAt: Date) => {
      const djsNow = dayjs();
      const djsClosedAt = dayjs(closedAt);
      const diff = djsClosedAt.diff(djsNow);

      if (diff <= 0) {
        setTimeLeft("Closed");
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const padMin = String(minutes).padStart(2, "0");
      const padSec = String(seconds).padStart(2, "0");
      setTimeLeft(`Ends in ${padMin}:${padSec}`);
    };

    if (!gameRound) {
      setTimeLeft("");
      return;
    }
    updateTimer(gameRound.closed_at);
    const timerId = setInterval(() => updateTimer(gameRound.closed_at), 1000);
    return () => clearInterval(timerId);
  }, [gameRound]);

  if (isLoading) return <p className="w-fit mx-auto mt-5">Loading ...</p>;
  if (!gameRound)
    return (
      <p className="w-fit mx-auto mt-5">No rounds in progress. Stay tuned!</p>
    );

  return (
    <>
      <div className="w-full flex gap-5 justify-start px-4 mt-1">
        <div className="font-bold">Round #{gameRound.id}</div>
        <div>{timeLeft}</div>
      </div>

      {!gameRound.winning_choice ? (
        new Date() < gameRound.closed_at ? (
          <ActiveRoundContents
            gameRound={gameRound}
            reFetchGameRound={reFetchGameRound}
          />
        ) : (
          <p className="w-fit mx-auto mt-5">
            We're tallying the results. Please check back in a few minutes!
          </p>
        )
      ) : (
        <SettledRoundContents gameRound={gameRound} />
      )}
    </>
  );
};

export default GameRoundPage;
