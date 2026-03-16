import MainLayout from "./layout/MainLayout";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/DashboardPage";
import DevicesPage from "./pages/DevicesPage";
import AlertsPage from "./pages/AlertsPage";
import LogsPage from "./pages/LogsPage";
import Hero from "./pages/Hero";

const App = () => {
  // useEffect(() => {
  //   setLoading(false);
  //   (async () => {
  //     try {
  //       const { data } = await axios.get(
  //         `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/is-auth`,
  //         {
  //           withCredentials: true,
  //         },
  //       );
  //       console.log(data);

  //       if (data.success) {
  //         console.log("calling setUser");
  //         data.isAuth = true;
  //         dispatch(setUser(data));
  //         if (location.pathname === "/") {
  //           if (
  //             data?.user?.currentResumeId == "" ||
  //             data?.user?.currentResumeId == undefined
  //           ) {
  //             navigate("/onboarding");
  //           } else if (
  //             data?.user?.currentResumeId.length > 0 &&
  //             !data?.user?.isApproved
  //           ) {
  //             navigate(`/approve/${data?.user?.currentResumeId}`);
  //           } else {
  //             navigate("/dashboard");
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.log(error);
  //       let data = {
  //         user: {},
  //         isAuth: false,
  //       };
  //       dispatch(setAuthFalse(false));
  //       dispatch(setUser(data));
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, []);

  return (
    <div>
      <Routes>
        <Route index element={<Hero />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
