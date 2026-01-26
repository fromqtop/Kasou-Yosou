import {
  Award,
  EqualApproximately,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import UserIconMini from "./UserIconMini";
import type { Choice } from "../types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { twMerge } from "tailwind-merge";

dayjs.extend(relativeTime);

const CHOICE_CONFIG = {
  1: { text: "BEARISH", Icon: TrendingDown, color: "text-red-700" },
  2: { text: "NEUTRAL", Icon: EqualApproximately, color: "text-gray-500" },
  3: { text: "BULLISH", Icon: TrendingUp, color: "text-green-700" },
} as const;

interface Props {
  userName: string;
  choice: Choice;
  isWon: boolean;
}

const PredictionCard: React.FC<Props> = ({ userName, choice, isWon }) => {
  const Icon = CHOICE_CONFIG[choice].Icon;

  return (
    <div
      className={twMerge(
        "bg-zinc-800 border rounded-md border-zinc-500 px-2 py-1",
        isWon && "border-amber-300 bg-amber-300/10",
      )}
    >
      <div className="relative flex justify-between items-center">
        <div className="flex items-center gap-2 ">
          <UserIconMini userName={userName} />
          <div className="text-sm font-bold">{userName}</div>
        </div>
        {isWon && (
          <Award
            strokeWidth={2}
            className="absolute top-0 -right-2 text-amber-300 h-5"
          />
        )}
      </div>

      <div
        className={`flex justify-end items-center gap-1 ${CHOICE_CONFIG[choice].color}`}
      >
        <Icon strokeWidth={2.5} size={20} />
        <div className="text-sm font-bold">{CHOICE_CONFIG[choice].text}</div>
      </div>
    </div>
  );
};

export default PredictionCard;
