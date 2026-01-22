import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      // バックエンドのユーザー作成エンドポイントを叩く
      const response = await axios.post<User>(`${apiUrl}/users`, {
        name: name,
      });

      // 成功したら取得したユーザーIDを保存（これで「ログイン状態」にする）
      console.log(response);
      localStorage.setItem("uid", response.data.uid);
      console.log(localStorage.getItem("uid"));
      alert("登録完了！");
      navigate("/"); // ホームへ移動
    } catch (error) {
      console.error(error);
      alert("登録に失敗しました");
    }
  };

  return (
    <div>
      <h1>Kasou Yosou</h1>

      <div>
        <label>ユーザー名：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button onClick={handleRegister}>登録ボタン</button>
    </div>
  );
};

export default Register;
