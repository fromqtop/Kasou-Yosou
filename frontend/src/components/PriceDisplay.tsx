import dayjs from "dayjs";
import { Bitcoin } from "lucide-react";
import React from "react";

interface Props {
  price: number;
  startAt: Date;
}

const PriceDisplay: React.FC<Props> = ({ price, startAt }) => {
  return (
    <>
      <div className="flex">
        <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center mr-2">
          <Bitcoin className="w-5 h-5 stroke-2.5 text-white" />
        </div>
        <div className="text-5xl md:text-6xl font-bold">
          $
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>

      <div className="text-right text-md text-zinc-400">
        at {dayjs(startAt).format("M/D HH:mm")}
      </div>
    </>
  );
};

export default PriceDisplay;
