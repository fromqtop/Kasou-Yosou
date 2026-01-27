import React from "react";
import Header from "./components/Header";
import { Outlet } from "react-router-dom";
import type { UserMini } from "./types";
import Footer from "./components/Footer";

interface Props {
  user: UserMini | null;
  refetchUser: () => Promise<void>;
}

const scrollBarStyle = `
  flex-1 overflow-y-auto 
  [&::-webkit-scrollbar]:w-1.5
  [&::-webkit-scrollbar-track]:bg-zinc-900
  [&::-webkit-scrollbar-thumb]:bg-zinc-700
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:hover:bg-zinc-600
`;
const Layout: React.FC<Props> = ({ user, refetchUser }) => {
  return (
    <>
      <div className="h-screen flex flex-col">
        <Header user={user} />

        <main
          className={`flex-1 flex flex-col min-h-0 pb-20 md:pb-0 overflow-y-auto
            ${scrollBarStyle}`}
        >
          <Outlet context={{ user, refetchUser }} />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Layout;
