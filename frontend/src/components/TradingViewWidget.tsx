import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // コンテナの中身を一度空にする（二重表示防止）
    if (container.current) {
      container.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // ウィジェットの設定;
    script.innerHTML = `
      {
        "allow_symbol_change": false,
        "calendar": false,
        "details": false,
        "hide_side_toolbar": true,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "15",
        "locale": "ja",
        "save_image": false,
        "style": "3",
        "symbol": "BINANCE:BTCUSDT",
        "theme": "dark",
        "timezone": "Asia/Tokyo",
        "backgroundColor": "#0F0F0F",
        "gridColor": "rgba(242, 242, 242, 0.06)",
        "watchlist": [],
        "withdateranges": false,
        "range": "1D",
        "compareSymbols": [],
        "studies": [],
        "autosize": true
      }`;

    if (container.current) {
      container.current.appendChild(script);
    }
  }, []); // 空の配列で初回のみ実行

  return (
    /* 親要素に高さを指定しないと表示されません */
    <div className="w-full h-75 bg-slate-900 rounded-xl overflow-hidden">
      <div
        ref={container}
        className="tradingview-widget-container"
        style={{ height: "100%", width: "100%" }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "100%", width: "100%" }}
        ></div>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
