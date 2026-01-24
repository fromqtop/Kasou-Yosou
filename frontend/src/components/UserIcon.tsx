import React from "react";

interface Props {
  userName: string;
}

const UserIcon: React.FC<Props> = ({ userName }) => {
  return (
    <div className="h-10 w-10 bg-zinc-800 font-bold border border-zinc-500 rounded-full flex items-center justify-center">
      <span>{[...userName][0]}</span>
    </div>
  );
};

export default UserIcon;
