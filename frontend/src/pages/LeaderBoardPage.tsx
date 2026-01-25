import axios from "axios";
import { useEffect, useState } from "react";
import type { LeaderBoard, UserMini, UserStats } from "../types";
import { useOutletContext } from "react-router-dom";
import UserIcon from "../components/UserIcon";

const LeaderBoardPage: React.FC = () => {
  const { user } = useOutletContext<{
    user: UserMini | null;
  }>();

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderBoard, setLeaderBoard] = useState<LeaderBoard[]>([]);

  const fetchUserStats = async (username: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get<UserStats>(
        `${apiUrl}/leaderboard/me?username=${username}`,
      );
      setUserStats(response.data);
    } catch (error) {
      console.error("ユーザーStats取得に失敗:", error);
    }
  };

  const fetchLeaderBoard = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get<LeaderBoard[]>(`${apiUrl}/leaderboard`);
      setLeaderBoard(response.data);
    } catch (error) {
      console.error("リーダーボード取得に失敗:", error);
    }
  };

  useEffect(() => {
    fetchLeaderBoard();
  }, []);

  useEffect(() => {
    if (!user?.name) return;
    fetchUserStats(user.name);
  }, [user]);

  const rank = userStats?.rank ?? "-";
  const totalRounds = userStats?.total_rounds ?? "-";
  const wins = userStats?.wins ?? "-";
  const winRate = userStats ? Math.round(userStats.win_rate * 100) : "-";

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="my-5 text-3xl font-bold">Leader Board</h2>

      {user ? (
        <>
          <div className="relative w-fit py-2 px-4 flex gap-4 border border-zinc-500 rounded bg-zinc-800">
            <UserIcon userName={user?.name} />

            <div>
              <div className="flex gap-4">
                <div className="font-bold">{user?.name}</div>
                <div className="font-bold text-amber-400">
                  {user?.points} Points
                </div>
              </div>

              <div className="mt-2 flex gap-4">
                <div>
                  <span className="text-xs">Total Rounds</span> {totalRounds}
                </div>
                <div>
                  <span className="text-xs">Wins</span> {wins} ({winRate}%)
                </div>
              </div>
            </div>

            <div
              className="
              absolute top-0 right-0 translate-x-5 -translate-y-3 
              px-2 rounded bg-red-800 text-md font-bold"
            >
              # {rank}
            </div>
          </div>
        </>
      ) : (
        <span>Loading ...</span>
      )}

      <div className="mt-5">
        <table className="mx-auto border-separate border-spacing-x-4">
          <thead>
            <tr>
              <th className="w-10 text-right">Rank</th>
              <th className="w-50 text-left">Name</th>
              <th className="w-20 text-right">Points</th>
              <th className="w-20 text-right">Total Rounds</th>
              <th className="w-20 text-right">Wins</th>
              <th className="w-20 text-right">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {leaderBoard.map((item) => (
              <tr>
                <td className="text-right">{item.rank}</td>
                <td className="text-left flex items-center gap-2">
                  {item.username}
                  {item.username === user?.name && (
                    <div className="px-1 h-2/3 rounded text-xs bg-blue-900">
                      YOU
                    </div>
                  )}
                </td>
                <td className="text-right">{item.points}</td>
                <td className="text-right">{item.total_rounds}</td>
                <td className="text-right">{item.wins}</td>
                <td className="text-right">
                  {Math.round(item.win_rate * 100)} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderBoardPage;
