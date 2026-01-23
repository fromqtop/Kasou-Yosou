import { useEffect, useState } from "react";
import type { UserMini } from "../types";
import axios from "axios";

export const useUser = () => {
  const [user, setUser] = useState<UserMini | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    console.log("fetchUser");
    const savedUid = localStorage.getItem("uid");
    if (savedUid) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.post<UserMini>(`${apiUrl}/users/me`, {
          uid: savedUid,
        });

        setUser(response.data);
      } catch (error) {
        console.error("ユーザー情報の取得に失敗:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, refetchUser: fetchUser };
};
