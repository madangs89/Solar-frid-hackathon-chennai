import MainLayout from "./layout/MainLayout";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/DashboardPage";
import DevicesPage from "./pages/DevicesPage";
import AlertsPage from "./pages/AlertsPage";
import LogsPage from "./pages/LogsPage";
import Hero from "./pages/Hero";

const App = () => {
  return (
    <div>
      <Hero />
      {/* <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Route>
      </Routes> */}
    </div>
  );
};

export default App;
