import React, { useEffect, useState } from "react";
import type { User } from "../types";

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // ログイン状態の確認（実際はAPIを叩く）
  useEffect(() => {
    const savedId = localStorage.getItem("uid");
    if (savedId) {
      // TODO: APIからユーザー情報を取得
      // setUser(res.data);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* 1. サイトタイトル & ユーザー情報 */}
      <header className="w-full max-w-2xl flex justify-between items-center py-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Kasou Yosou</h1>
        <div className="text-right text-sm">
          {user ? (
            <p>
              {user.name} さん ({user.points}pt)
            </p>
          ) : (
            <button className="text-blue-500 underline">ログイン/登録</button>
          )}
        </div>
      </header>

      <main className="w-full max-w-2xl mt-8 space-y-8">
        {/* 2. チャート表示エリア（仮） */}
        <section className="bg-white border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
          <p className="text-gray-400">[ ここにチャートを表示 ]</p>
        </section>

        {/* 3. 価格表示エリア */}
        <section className="text-center">
          <h2 className="text-gray-500 text-sm uppercase tracking-widest">
            Current Price
          </h2>
          <div className="text-4xl font-mono font-bold">$ 96,500.20</div>
        </section>

        {/* 4. 予想ボタンエリア */}
        <section className="grid grid-cols-2 gap-4">
          <button className="py-8 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-2xl font-bold shadow-lg transition-transform active:scale-95">
            UP
          </button>
          <button className="py-8 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-2xl font-bold shadow-lg transition-transform active:scale-95">
            DOWN
          </button>
        </section>

        {/* 5. コンテスト情報 */}
        <footer className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
          <p>現在のラウンド: #1042</p>
          <p>締め切りまで: 02:45</p>
        </footer>
      </main>
    </div>
  );
};

export default Home;
