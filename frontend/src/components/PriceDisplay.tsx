import dayjs from "dayjs";
import React from "react";

interface Props {
  price: number;
  startAt: Date;
}

const PriceDisplay: React.FC<Props> = ({ price, startAt }) => {
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      <div></div>
      <div className="text-6xl font-bold">
        $
        {price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <div className="text-xl text-zinc-400">
        at {dayjs(startAt).format("M/D HH:mm")}
      </div>
    </div>
  );
};

export default PriceDisplay;
