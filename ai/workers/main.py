import json
import os
from datetime import datetime, timedelta

import ccxt
import holidays
import joblib
import numpy as np
import pandas as pd
import requests

# 環境変数ロード
API_URL = os.getenv("API_URL")
AI_USERS = os.getenv("AI_USERS")

# API_URLの未取得をもってローカルと判断する
if not API_URL:
    from dotenv import load_dotenv

    load_dotenv()
    API_URL = os.getenv("API_URL")
    AI_USERS = os.getenv("AI_USERS")
    print(API_URL)

# AI_USERSを取得
ai_users = json.loads(AI_USERS)


# 開催中のラウンドを取得
def get_active_round():
    url = f"{API_URL}/game_rounds/active"

    response = requests.get(url, timeout=10)
    response.raise_for_status()

    data = response.json()

    if data is None:
        raise ValueError("ActiveなRoundが存在しません")

    return data


# 予測用データの取得
def get_ohlcv_data(dt_from):
    since = int(dt_from.timestamp() * 1000)

    exchange = ccxt.binance({"enableRateLimit": True})
    symbol = "BTC/USDT"
    timeframe = "1h"
    since = since
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe, since=since)

    return ohlcv


# 特徴量の追加
def pre_processing(ohlcv):
    df = pd.DataFrame(ohlcv)
    df.columns = ["timestamp", "open", "high", "low", "close", "volume"]

    # datetime列を追加（timestampから算出）
    df["datetime"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)

    # datetime列をindexとし、1h毎のデータにする
    df_resample = df.set_index("datetime").resample("1h").asfreq()

    # timestamp全体をdatetimeから算出しセットしなおす
    df_resample["timestamp"] = df_resample.index.map(
        lambda x: int(x.timestamp() * 1000)
    )

    # volumeが低すぎるデータは異常値としてNaNにする
    min_vol = 10
    df_resample.loc[df_resample["volume"] <= min_vol, "volume"] = np.nan

    # 欠損を含む行の確認
    df_resample[df_resample.isnull().any(axis=1)]
    df_feat1 = df_resample.copy()

    # day列を追加
    day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    df_feat1["day"] = df_feat1.index.dayofweek.map(lambda x: day_names[x])

    # dayをダミー変数化
    day = pd.get_dummies(df_feat1["day"], drop_first=False, dtype=int)
    df_feat1 = pd.concat([df_feat1, day], axis=1).drop("day", axis=1)

    # 足りない列（sat, sunなど）を 0 で埋めて強制的に作成する
    for col in day_names:
        if col not in df_feat1.columns:
            df_feat1[col] = 0

    # dfに存在する"年"のリストを作成する
    years = df_feat1.index.year.unique().tolist()

    # アメリカの祝日を取得
    us_holidays = holidays.UnitedStates(years=years)

    # 特徴量の追加　祝日 (1: 祝日, 0: 平日)
    df_feat1["is_holiday"] = df_feat1.index.map(lambda x: 1 if x in us_holidays else 0)

    df_feat1["is_off_day"] = (
        df_feat1[["sat", "sun", "is_holiday"]].any(axis=1).astype(int)
    )

    df_feat2 = df_feat1.copy()

    # ｎ時間前からのリターン（対数収益率）
    for n in [1, 2, 4, 12, 24]:
        df_feat2[f"log_ret_{n}h"] = np.log(
            df_feat2["close"] / df_feat2["close"].shift(n)
        )

    # ｎ時間のボラティリティ
    for n in [4, 24]:
        df_feat2[f"vola_{n}h"] = df_feat2["log_ret_1h"].rolling(n).std()

    # 出来高比率
    vol_mean24 = df_feat2["volume"].rolling(24).mean()
    df_feat2["vol_ratio_24h"] = (df_feat2["volume"] - vol_mean24) / vol_mean24

    # 24h移動平均との乖離
    sma_24 = df_feat2["close"].rolling(24).mean()
    df_feat2["bias_24h"] = (df_feat2["close"] - sma_24) / sma_24

    return df_feat2


# 予測
def predict(model_path, scaler_path, X):
    if scaler_path:
        scaler = joblib.load(scaler_path)
        X = scaler.transform(X)
        X = pd.DataFrame(X, columns=feature_cols)

    model = joblib.load(model_path)
    y = model.predict(X)

    return y


if __name__ == "__main__":
    # アクティブラウンドを取得
    data = get_active_round()
    game_round_id = data.get("id")
    dt_start_at = datetime.fromisoformat(data.get("start_at").replace("Z", "+00:00"))
    print("アクティブラウンドID:", {game_round_id})
    print("ラウンド開始時刻:", {dt_start_at})
    print()

    # Binanceからohlcvを取得
    dt_from = dt_start_at - timedelta(hours=30)
    ohlcv = get_ohlcv_data(dt_from)
    print("ohlcv取得成功:")
    print(ohlcv[-5:])
    print()

    # データ前処理実施
    df = pre_processing(ohlcv)
    print("データ前処理成功 tailを表示")
    print(df.tail())
    print()

    start_unixtime = int(dt_start_at.timestamp() * 1000)
    print("start_at_timestamp:", start_unixtime)

    df_predict_row = df[df["timestamp"] == start_unixtime]
    print(f"{df_predict_row=}")
    print()

    # AI予測
    print("予測投稿開始")
    feature_cols = [
        "mon",
        "sat",
        "sun",
        "thu",
        "tue",
        "wed",
        "is_holiday",
        "is_off_day",
        "log_ret_1h",
        "log_ret_2h",
        "log_ret_4h",
        "log_ret_12h",
        "log_ret_24h",
        "vola_4h",
        "vola_24h",
        "vol_ratio_24h",
        "bias_24h",
    ]
    X = df_predict_row[feature_cols]
    print(f"{X=}")

    url = f"{API_URL}/game_rounds/{game_round_id}/predictions"
    model_dir = os.path.abspath("models")

    for ai in ai_users:
        try:
            print()
            print("model:", ai.get("file"))
            model_path = os.path.join(model_dir, ai.get("file"))

            scaler_path = None
            if ai.get("scaler_file"):
                scaler_path = os.path.join(model_dir, ai.get("scaler_file"))

            y = predict(model_path, scaler_path, X)
            choice = y[0].item()
            print("choice:", choice)

            payload = {"user_uid": ai.get("uuid"), "choice": choice}
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()

            print("予測の投稿に成功！")
            print(f"Response: {response.json()}")

        except Exception as e:
            print("予測・投稿失敗")
            print(e)
