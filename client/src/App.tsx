import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Goals from "./components/Goals";
import WorkoutHistory from "./components/History";
import Layout from "./components/Layout";
import Leaderboard from "./components/Leaderboard";
import LogWorkout from "./components/LogWorkout";
import PersonalRecords from "./components/PersonalRecords";
import ProgressCharts from "./components/ProgressCharts";
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
          <Route path="/progress" element={<ProgressCharts />} />
          <Route path="/goals" element={<Goals />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
