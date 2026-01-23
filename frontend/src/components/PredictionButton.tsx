import { type LucideIcon } from "lucide-react";
import React from "react";

type VariantStyle = {
  buttonStyle: string;
  selectedButtonStyle: string;
  badgeStyle: string;
};

interface Props {
  choiceId: number;
  label: string;
  subtext: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}

const baseStyle = `
  flex-1 relative py-5
  border rounded-2xl
  flex flex-col justify-center items-center
  transition duration-300 bg-zinc-800 border-zinc-500
`;

const variants: Record<number, VariantStyle> = {
  // bearish
  1: {
    buttonStyle: "hover:border-red-800 hover:bg-red-950/10!",
    selectedButtonStyle: "border-red-500! bg-red-950/70!",
    badgeStyle: "bg-red-700",
  },
  // neutral
  2: {
    buttonStyle: "hover:border-gray-400 hover:bg-gray-50/10",
    selectedButtonStyle: "border-gray-200! bg-gray-700/70!",
    badgeStyle: "bg-gray-200 text-gray-600!",
  },
  // bullish
  3: {
    buttonStyle: "hover:border-green-700 hover:bg-green-600/10",
    selectedButtonStyle: "border-green-500! bg-green-950/70!",
    badgeStyle: "bg-green-800",
  },
};

const PredictionButton: React.FC<Props> = ({
  choiceId,
  label,
  subtext,
  icon,
  selected,
  onClick,
}) => {
  const Icon = icon;
  const buttonStyles = selected
    ? baseStyle + " " + variants[choiceId].selectedButtonStyle
    : baseStyle + " " + variants[choiceId].buttonStyle;

  return (
    <button className={buttonStyles} onClick={onClick}>
      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>

      <h3 className="text-xl">{label}</h3>
      <p className="text-sm text-zinc-400">{subtext}</p>

      {selected && (
        <div
          className={`
            px-3 py-0.5 rounded-b-md
            absolute top-0 left-1/2 -translate-x-1/2
            text-white text-xs font-bold 
            ${variants[choiceId].badgeStyle}`}
        >
          SELECTED
        </div>
      )}
    </button>
  );
};

export default PredictionButton;
