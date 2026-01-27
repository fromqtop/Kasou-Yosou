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
    <div
      className="flex-row lg:flex-col lg:w-80
    bg-zinc-900 p-4"
    >
      <div>
        <div className="my-2 text-2xl font-bold">Bets</div>
        <ParticipantStats choices={choices} />
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
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
          <p>No Participants...</p>
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
