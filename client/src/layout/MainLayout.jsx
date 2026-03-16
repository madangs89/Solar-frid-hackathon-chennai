import React, { useEffect } from "react";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";

const MainLayout = () => {
  const authSlice = useSelector((state) => state.auth);

  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    console.log(authSlice.isAuth);

    if (!authSlice.isAuth) {
      navigate("/");
    } else {
      if (location.pathname === "/") {
        navigate("/dashboard");
      }
    }
  }, [authSlice.isAuth]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
