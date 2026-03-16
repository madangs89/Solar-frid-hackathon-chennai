import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";

import Login from "../components/Login";
import AnimatedButton from "../components/AnimatedButton";
import Cursor from "../components/Cursor";
import { useSelector } from "react-redux";

const Hero = () => {
  const navigate = useNavigate();
  const [loginModal, setLoginModal] = useState(false);

  const bgRef = useRef(null);
  const navRef = useRef(null);
  const heroRef = useRef(null);
  const btnRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const location = useLocation();

  const authSlice = useSelector((state) => state.auth);

  useEffect(() => {
    if (location.pathname == "/" && authSlice.isAuth) {
      navigate("/dashboard");
    }
  }, [authSlice, location, navigate]);

  useEffect(() => {
    gsap.to(leftRef.current, {
      x: -window.innerWidth,
      duration: 1,
      opacity: 0,
      ease: "power3.out",
    });
    gsap.to(rightRef.current, {
      x: window.innerWidth,
      duration: 1,
      opacity: 0,
      ease: "power3.out",
    });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(bgRef.current, {
      scale: 1.05,
      opacity: 0,
      duration: 1.2,
    })

      .from(
        navRef.current,
        {
          y: 50,
          opacity: 0,
          duration: 1,
        },
        "-=0.8",
      )
      .from(
        heroRef.current,
        {
          y: 80,
          opacity: 0,
          duration: 1.2,
        },
        "-=0.6",
      )
      .from(
        btnRef.current,
        {
          y: 1,
          opacity: 0,
          duration: 0.6,
        },
        "-=0.8",
      );
  }, []);

  //   useEffect(() => {
  //     if (!socketSlice.socket) {
  //       const socket = io(import.meta.env.VITE_BACKEND_URL, {
  //         transports: ["websocket"],
  //         withCredentials: true,
  //         auth: {
  //           id: authSlice.user?._id,
  //         },
  //       });
  //       socket.on("connect", () => {
  //         dispatch(setSocket(socket));
  //       });
  //     }
  //   }, [authSlice.isAuth, socketSlice.socket, authSlice.user?._id, dispatch]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black cursor-none font-['Manrope']">
      {/* Background */}
      <img
        ref={bgRef}
        src="https://karim-saab.com/images/Frame-4_1.avif"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />

      <div
        ref={leftRef}
        className="absolute z-[9999999] w-1/2 bg-[#292828] left-0 h-full"
      ></div>
      <div
        ref={rightRef}
        className="absolute z-[9999999] w-1/2 bg-[#292828]  right-0 h-full"
      ></div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <Cursor />

      <div className="relative z-20 h-full flex flex-col">
        {/* Navbar */}
        <nav
          ref={navRef}
          className="flex justify-between items-center px-10 py-6"
        >
          <h1 className="text-2xl font-semibold text-white tracking-wide">
            Ener<span className="text-gray-400">Vue</span>
          </h1>

          <div className="space-x-4 flex">
            {["LOGIN"].map((item) => (
              <div
                key={item}
                onClick={() => item === "LOGIN" && setLoginModal(true)}
                className=""
              >
                <AnimatedButton onClick={() => {}} text={item} px={6} py={2} />
              </div>
            ))}
          </div>
        </nav>

        {/* Hero */}
        <div className="flex flex-col flex-grow items-center justify-center text-center px-6">
          <h1
            ref={heroRef}
            className="text-4xl md:text-6xl font-semibold text-white leading-tight"
          >
            Real-Time AI Monitoring for Solar Microgrids
          </h1>

          <div
            onMouseEnter={() =>
              gsap.to("#cursor", { scale: 2.5, duration: 0.3 })
            }
            onMouseLeave={() => gsap.to("#cursor", { scale: 1, duration: 0.3 })}
            onClick={() => setLoginModal(true)}
            ref={btnRef}
            className="mt-7 w-[300px]"
          >
            <AnimatedButton
              onClick={() => {}}
              text={"START EXPERIENCE"}
              px={6}
              py={3}
            />
          </div>
        </div>

        {/* Bottom Links */}
        <div className="absolute bottom-6 left-6 text-white text-sm tracking-widest">
          LINKEDIN
        </div>

        <div className="absolute bottom-6 right-6 text-white text-sm tracking-widest">
          GITHUB
        </div>
      </div>

      {loginModal && (
        <div className="fixed z-40 inset-0 bg-black/80 flex items-center justify-center z-30">
          <Login onClose={() => setLoginModal(false)} />
        </div>
      )}
    </div>
  );
};

export default Hero;
