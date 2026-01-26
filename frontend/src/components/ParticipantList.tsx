import type { Choice } from "../types";
import ParticipantStats from "./ParticipantStats";
import PredictionCard from "./PredictionCard";

interface Props {
  participants: {
    userName: string;
    choice: Choice;
  }[];
  winningChoice?: Choice;
}

const ParticipantList: React.FC<Props> = ({ participants, winningChoice }) => {
  const choices = participants.map((p) => p.choice);

  return (
    <div className="w-75 px-4 border-l border-zinc-700">
      <div className="my-2 text-2xl font-bold">Bets</div>

      <ParticipantStats choices={choices} />

      <div className="flex flex-col gap-3 mt-5">
        {participants && participants.length ? (
          participants.map((participant) => (
            <PredictionCard
              key={participant.userName}
              userName={participant.userName}
              choice={participant.choice}
              isWon={participant.choice === winningChoice}
            />
          ))
        ) : (
          <p>参加者なし</p>
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
