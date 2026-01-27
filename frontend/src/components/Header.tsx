import React from "react";
import type { UserMini } from "../types";
import { Link, NavLink } from "react-router-dom";
import UserIcon from "../components/UserIcon";

interface Props {
  user: UserMini | null;
}

const Header: React.FC<Props> = ({ user }) => {
  const links = [
    { text: "Live Prediction", to: "/game_rounds/active" },
    { text: "Leader Board", to: "/leaderboard" },
  ];

  return (
    <header
      className="w-full h-15 flex-none px-5 
      flex justify-between items-center 
      border-b border-zinc-700"
    >
      {/* 左よせ */}
      <h1 className="text-2xl font-bold">Kasou Yosou</h1>

      {/* 右よせ */}
      <div className="flex gap-10">
        {/* ナビ (タブレット以上）*/}
        <ul className="hidden md:flex gap-5 items-center">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `font-bold
                hover:text-white hover:underline underline-offset-5 decoration-white
                  ${isActive ? "text-white underline underline-offset-5 decoration-white" : "text-zinc-400 "}`
                }
              >
                {link.text}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ポイント・アイコン */}
        <div>
          {user ? (
            <div className="flex gap-3">
              <div
                className="h-10 min-w-18 w-20
                flex items-center justify-center
                border border-zinc-500 rounded-lg bg-zinc-800 "
              >
                <span className="font-bold text-amber-400">
                  {user.points} pts
                </span>
              </div>
              <UserIcon userName={user.name} />
            </div>
          ) : (
            // 未ログイン時はSignUpボタン
            <Link
              to="register"
              className="h-10 my-5 p-5 bg-zinc-800 border border-zinc-500 rounded-lg flex items-center justify-center
              hover:bg-zinc-700 active:bg-zinc-600
                focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <span>Sign Up</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
