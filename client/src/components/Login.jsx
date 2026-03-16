import { useState } from "react";
import { Chrome, X, Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setAuth, setUser } from "../redux/Slice/authSlice";

export default function Login({ onClose }) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleGoogleLogin = async (obj) => {
    console.log(obj);

    try {
      setIsGoogleLoading(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`,
        { code: obj.code },
        {
          withCredentials: true,
        },
      );
      console.log(data);
      if (data.success) {
        toast.success("Login Success");

        dispatch(setAuth(true));
        dispatch(setUser(data.user));

        navigate("/dashboard");

        console.log(data);
      }
    } catch (error) {
      toast.error(error.response.data.message || "Google Login Failed");
      console.log(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLogin,
    onError: handleGoogleLogin,
    flow: "auth-code",
  });

  return (
    <div className="relative bg-white p-8 rounded-3xl shadow-2xl w-[400px] transition-all duration-300">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
      >
        <X size={20} />
      </button>

      {/* Title */}
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
        Welcome Back 👋
      </h2>

      <p className="text-center text-gray-500 mb-8">
        Sign in securely with Google
      </p>

      {/* Google Button */}
      <button
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-300 bg-white disabled:opacity-70"
      >
        {isGoogleLoading ? (
          <>
            {/* <Loader2 className="animate-spin" size={20} /> */}
            Signing in...
          </>
        ) : (
          <>
            <button
              className="flex items-center justify-center gap-2"
              onClick={() => {
                setIsGoogleLoading(true);
                googleLogin();
              }}
            >
              <Chrome size={20} />
              Continue with Google
            </button>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-grow h-px bg-gray-200"></div>
        <span className="mx-3 text-sm text-gray-400">Secure Access</span>
        <div className="flex-grow h-px bg-gray-200"></div>
      </div>

      {/* Footer */}
      <p className="text-xs text-center text-gray-400">
        By continuing, you agree to our Terms & Privacy Policy.
      </p>
    </div>
  );
}
