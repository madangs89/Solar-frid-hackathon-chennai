import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const linkStyle =
    "flex items-center gap-2 px-3 py-1 rounded-md text-sm text-gray-300 hover:bg-gray-800";

  const activeStyle = "bg-gray-800 text-white";

  const navigate = useNavigate();

  return (
    <div className="w-full bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 font-semibold text-white">
          ⚡ EnerVue
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : ""}`
            }
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("/devices")}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : ""}`
            }
          >
            Devices
          </button>

          <button
            onClick={() => navigate("/alerts")}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : ""}`
            }
          >
            Alerts
          </button>

          <button
            onClick={() => navigate("/logs")}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : ""}`
            }
          >
            Logs
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 text-sm text-gray-300">
        <span className="text-gray-500">09:35:23 pm</span>

        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          LIVE
        </span>

        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          D
        </div>
      </div>
    </div>
  );
};

export default Navbar;
