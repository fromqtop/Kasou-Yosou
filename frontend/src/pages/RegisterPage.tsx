import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { User } from "../types";

const RegisterPage: React.FC = () => {
  const { refetchUser } = useOutletContext<{
    refetchUser: () => Promise<void>;
  }>();

  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post<User>(`${apiUrl}/users`, {
        name: name,
      });

      // 成功したら取得したユーザーIDを保存（これで「ログイン状態」にする）
      console.log(response);
      localStorage.setItem("uid", response.data.uid);
      console.log(localStorage.getItem("uid"));
      alert("登録完了！");
      await refetchUser();
      navigate("/"); // ホームへ移動
    } catch (error) {
      console.error(error);
      alert("登録に失敗しました");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <h2 className="text-6xl my-8">SIGN UP</h2>
      <div>
        <div>
          <label>Handle Name</label>
        </div>
        <input
          type="text"
          className="my-3 p-3 w-full bg-zinc-800 border-b border-zinc-500 text-2xl
            focus:outline-none focus:border-b-zinc-300 placeholder-zinc-700"
          placeholder="Mr. Kasou Yosou"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button
        className="h-10 my-5 p-5 bg-zinc-800 border border-zinc-500 rounded-lg flex items-center justify-center
          hover:bg-zinc-700 active:bg-zinc-600
          focus:outline-none focus:ring-2 focus:ring-zinc-400"
        onClick={handleRegister}
      >
        Sign Up !
      </button>
    </div>
  );
};

export default RegisterPage;
