import { EqualApproximately, TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

const KEYS = [1, 2, 3] as const;
const CHOICE_CONFIG = {
  1: {
    text: "BEARISH",
    Icon: TrendingDown,
    textColor: "text-red-700",
    bgColor: "bg-red-700",
  },
  2: {
    text: "NEUTRAL",
    Icon: EqualApproximately,
    textColor: "text-gray-500",
    bgColor: "bg-gray-500",
  },
  3: {
    text: "BULLISH",
    Icon: TrendingUp,
    textColor: "text-green-700",
    bgColor: "bg-green-700",
  },
} as const;

interface Props {
  choices: number[];
}

const ParticipantStats: React.FC<Props> = ({ choices }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-3">
        {KEYS.map((key) => {
          const config = CHOICE_CONFIG[key];
          const count = choices.filter((c) => c === key).length;

          return (
            <div className={`flex items-center gap-1 ${config.textColor}`}>
              <config.Icon size={18} /> <span className="text-sm">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="flex w-full">
        {KEYS.map((key) => {
          const config = CHOICE_CONFIG[key];
          const count = choices.filter((c) => c === key).length;
          const pct = (count / choices.length) * 100;

          return (
            <>
              <div
                className={`h-1 ${config.bgColor}`}
                style={{ width: `${pct}%` }}
              ></div>
              <div className="bg-red-"></div>
            </>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantStats;
