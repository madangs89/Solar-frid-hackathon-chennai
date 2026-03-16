import React, { useState } from "react";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("signin");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 text-xl font-semibold">
          ⚡ EnerVue
        </div>
        <p className="text-xs tracking-[0.3em] text-gray-400 mt-2">
          MICROGRID MONITOR
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-8 w-[380px] shadow-xl">
        {/* Tabs */}
        <div className="flex bg-[#121212] rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-2 rounded-md text-sm ${
              activeTab === "signin"
                ? "bg-gray-200 text-black"
                : "text-gray-400"
            }`}
          >
            Sign In
          </button>

          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2 rounded-md text-sm ${
              activeTab === "register"
                ? "bg-gray-200 text-black"
                : "text-gray-400"
            }`}
          >
            Register
          </button>
        </div>

        {/* Google Button */}
        <button className="w-full border border-gray-700 rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-[#141414] transition mb-6">
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 h-px bg-gray-800"></div>
          <span className="px-3 text-gray-500 text-xs">OR</span>
          <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-xs text-gray-400">EMAIL</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full mt-1 bg-[#121212] border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-xs text-gray-400">PASSWORD</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full mt-1 bg-[#121212] border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
          />
        </div>

        {/* Sign In Button */}
        <button className="w-full bg-gray-200 text-black py-3 rounded-lg font-medium hover:bg-white transition">
          {activeTab === "signin" ? "Sign In" : "Register"}
        </button>

        {/* Reset */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Forgot password?{" "}
          <span className="text-white cursor-pointer hover:underline">
            Reset
          </span>
        </p>
      </div>

      {/* Footer */}
      <p className="text-gray-600 text-xs mt-6">
        © 2025 EnerVue Technologies - Secure Energy Monitoring
      </p>
    </div>
  );
};

export default AuthPage;
