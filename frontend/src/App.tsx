import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout";
import GameRoundPage from "./pages/GameRoundPage";
import { useUser } from "./hooks/useUser";
import RegisterPage from "./pages/RegisterPage";

const App: React.FC = () => {
  const { user, refetchUser } = useUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} refetchUser={refetchUser} />}>
          <Route
            path="/"
            element={<Navigate to="/game_rounds/active" replace />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/game_rounds/:id" element={<GameRoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
