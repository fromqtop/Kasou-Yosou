import { EqualApproximately, TrendingDown, TrendingUp } from "lucide-react";
import UserIconMini from "./UserIconMini";
import type { Choice } from "../types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const CHOICE_CONFIG = {
  1: { text: "BEARISH", Icon: TrendingDown, color: "text-red-700" },
  2: { text: "NEUTRAL", Icon: EqualApproximately, color: "text-gray-500" },
  3: { text: "BULLISH", Icon: TrendingUp, color: "text-green-700" },
} as const;

interface Props {
  userName: string;
  choice: Choice;
}

const PredictionCard: React.FC<Props> = ({ userName, choice }) => {
  const Icon = CHOICE_CONFIG[choice].Icon;

  return (
    <div className="bg-zinc-800 border rounded-md border-zinc-500 px-2 py-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 ">
          <UserIconMini userName={userName} />
          <div className="text-sm font-bold">{userName}</div>
        </div>
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
