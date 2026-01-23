import React from "react";
import Header from "./components/Header";
import { Outlet } from "react-router-dom";
import type { UserMini } from "./types";

interface Props {
  user: UserMini | null;
  refetchUser: () => Promise<void>;
}

const Layout: React.FC<Props> = ({ user, refetchUser }) => {
  return (
    <>
      <div className="min-h-screen bg-zinc-900 text-white">
        <Header user={user} />

        <main className="px-4">
          <Outlet context={{ user, refetchUser }} />
        </main>
      </div>
    </>
  );
};

export default Layout;
