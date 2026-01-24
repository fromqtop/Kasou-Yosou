import React from "react";

interface Props {
  userName: string;
}

const UserIconMini: React.FC<Props> = ({ userName }) => {
  return (
    <div className="h-8 w-8 bg-zinc-800 font-bold border border-zinc-500 rounded-full flex items-center justify-center">
      <span>{[...userName][0]}</span>
    </div>
  );
};

export default UserIconMini;
