import { NavLink } from "react-router-dom";

const Footer = () => {
  const links = [
    { text: "Live Prediction", to: "/game_rounds/active" },
    { text: "Leader Board", to: "/leaderboard" },
  ];

  return (
    <footer
      className="md:hidden fixed bottom-0 left-0 w-full
        border-t border-zinc-700 bg-zinc-900"
    >
      <ul className="flex divide-x divide-zinc-700 justify-around items-center">
        {links.map((link) => (
          <li
            className="flex-1 h-13 flex justify-center items-center"
            key={link.to}
          >
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
    </footer>
  );
};

export default Footer;
