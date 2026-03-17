import MainLayout from "./layout/MainLayout";
import { Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/DashboardPage";
import DevicesPage from "./pages/DevicesPage";
import AlertsPage from "./pages/AlertsPage";
import LogsPage from "./pages/LogsPage";
import Hero from "./pages/Hero";
import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setAuth, setUser } from "./redux/Slice/authSlice";
import { io } from "socket.io-client";
import { setSocket } from "./redux/Slice/socketSlice";
import StationDashboard from "./pages/StationDashboard";

const App = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const authSlice = useSelector((state) => state.auth);

  const socketSlice = useSelector((state) => state.socket);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(false);
    (async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/is-auth`,
          {
            withCredentials: true,
          },
        );
        console.log(data);

        if (data.success) {
          console.log("calling setUser");
          data.isAuth = true;
          dispatch(setAuth(true));
          dispatch(setUser(data.user));
          navigate("/dashboard");
        }
      } catch (error) {
        console.log(error);
        let data = {
          user: {},
          isAuth: false,
        };
        dispatch(setAuth(false));
        dispatch(setUser(data));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (socketSlice.socket) {
      return;
    }
    if (authSlice.isAuth && authSlice.user._id) {
      const socket = io(import.meta.env.VITE_BACKEND_URL, {
        reconnectionDelayMax: 10000,
        auth: {
          token: authSlice.user._id,
        },
      });

      socket.on("connect", () => {
        console.log("connected to server", socket.id);
      });

      dispatch(setSocket(socket));
    }
  }, [authSlice.isAuth, authSlice.user]);

  return (
    <div>
      <Routes>
        <Route index element={<Hero />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<StationDashboard />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
