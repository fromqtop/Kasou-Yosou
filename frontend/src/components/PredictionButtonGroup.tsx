import {
  EqualApproximately,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import PredictionButton from "./PredictionButton";

type PredictionButtonOptions = {
  choiceId: number;
  label: string;
  subtext: string;
  icon: LucideIcon;
};

interface Props {
  basePrice: number;
  selected: number | null;
  setSelected: React.Dispatch<React.SetStateAction<number | null>>;
}

const PredictionButtonGroup: React.FC<Props> = ({
  basePrice,
  selected,
  setSelected,
}) => {
  const buttonProps: PredictionButtonOptions[] = [
    {
      choiceId: 1,
      label: "BEARISH",
      subtext: `Drop 0.3%+ ($${(basePrice * 0.997).toFixed(2)}-)`,
      icon: TrendingDown,
    },
    {
      choiceId: 2,
      label: "NEUTRAL",
      subtext: `Stay within ±0.3%`,
      icon: EqualApproximately,
    },
    {
      choiceId: 3,
      label: "BULLISH",
      subtext: `Rise 0.3%+ ($${(basePrice * 1.003).toFixed(2)}+)`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="w-full flex justify-between gap-3">
      {buttonProps.map((btnProps) => (
        <PredictionButton
          key={btnProps.choiceId}
          {...btnProps}
          selected={selected === btnProps.choiceId}
          onClick={() => setSelected(btnProps.choiceId)}
        />
      ))}
    </div>
  );
};

export default PredictionButtonGroup;
