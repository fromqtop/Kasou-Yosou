import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import type { ChartRawData } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Filler,
  Title,
  Tooltip,
  Legend,
);

interface Props {
  chartRawData: ChartRawData;
  trend?: 1 | 2 | 3;
}

const TREND_COLOR = {
  1: "rgba(255, 30, 30, 0.8)",
  2: "rgba(220, 220, 220, 0.8)",
  3: "rgba(30, 255, 30, 0.8)",
};

const BtcLineChart: React.FC<Props> = ({ chartRawData, trend }) => {
  if (!chartRawData.before.length) return;

  // Start_At時点の価格データ
  const [baseTimeStamp, basePrice] =
    chartRawData.before[chartRawData.before.length - 1];

  // Roundの結果が出ているか判定
  const settled = chartRawData.after.length ? true : false;

  // Bear未来データ
  const futureDataBear = [
    [baseTimeStamp, basePrice],
    [baseTimeStamp + 1000 * 60 * 60 * 4, basePrice * 0.997],
  ];

  // Bull未来データ
  const futureDataBull = [
    [baseTimeStamp, basePrice],
    [baseTimeStamp + 1000 * 60 * 60 * 4, basePrice * 1.003],
  ];

  const resultData = settled
    ? [[baseTimeStamp, basePrice], ...chartRawData.after]
    : [];

  // Chart.js用データ
  const data: ChartData<"line", { x: number; y: number }[]> = {
    datasets: [
      // 基準時点までのチャート
      {
        label: "BTC / USDT",
        data: chartRawData.before.map((item) => ({
          x: item[0], // timestamp
          y: item[1], // price
        })),
        borderColor: "rgb(255, 159, 64)",
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return null;

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, "rgba(255, 159, 64, 0.5)"); // 上：少し濃いオレンジ
          gradient.addColorStop(1, "rgba(255, 159, 64, 0.05)"); // 下：ほぼ透明

          return gradient;
        },
        fill: true,
        tension: 0.3,
        pointRadius: (ctx) =>
          ctx.dataIndex === ctx.dataset.data.length - 1
            ? 10
            : ctx.dataIndex % 2 === 0
              ? 4
              : 0,
      },

      // Bear Line
      {
        label: "Bear",
        data: futureDataBear.map((item) => ({
          x: item[0], // timestamp
          y: item[1], // price
        })),
        hidden: settled,
        borderColor: TREND_COLOR[1],
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: (ctx) => (ctx.dataIndex === 0 ? 0 : 10),
      },

      // Bull Line
      {
        label: "Bull",
        data: futureDataBull.map((item) => ({
          x: item[0], // timestamp
          y: item[1], // price
        })),
        hidden: settled,
        borderColor: TREND_COLOR[3],
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: (ctx) => (ctx.dataIndex === 0 ? 0 : 10),
      },

      // Result Line
      {
        label: "Result",
        data: resultData.map((item) => ({
          x: item[0], // timestamp
          y: item[1], // price
        })),
        hidden: !settled,
        borderColor: trend ? TREND_COLOR[trend] : "transparent",
        tension: 0.3,
        pointRadius: (ctx) =>
          ctx.dataIndex === ctx.dataset.data.length - 1 ? 10 : 4,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true, // 親要素に合わせてリサイズする
    maintainAspectRatio: false, // 縦横比を固定しない
    resizeDelay: 0, // リサイズ検知を即座にする
    plugins: {
      legend: {
        display: false, // ラベルを消す
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "hour",
          displayFormats: {
            hour: "h a",
          },
        },
        grid: {
          color: "transparent", // 縦線
        },
        ticks: {
          stepSize: 2, // 2時間おき
          color: "rgba(255, 255, 255, 0.8)", // 価格目盛
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)", // 横線
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.8)", // 時刻目盛
        },
      },
    },
  };

  return <Line options={options} data={data} className="w-full!" />;
};

export default BtcLineChart;
