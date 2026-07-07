import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import WorkoutHistory from "./components/History";
import Layout from "./components/Layout";
import Leaderboard from "./components/Leaderboard";
import LogWorkout from "./components/LogWorkout";
import PersonalRecords from "./components/PersonalRecords";
import Search from "./components/Search";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LogWorkout />} />
          <Route path="/workout-history" element={<WorkoutHistory />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/personal-records" element={<PersonalRecords />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
