import { useRef } from "react";
import { gsap } from "gsap";

const AnimatedButton = ({ text, px, py }) => {
  const fillRef = useRef(null);

  const handleEnter = () => {
    gsap.to(fillRef.current, {
      height: "100%",
      duration: 0.4,
      ease: "power3.out",
      backgroundColor: "black",
    //   width: "100%",
    });
  };

  const handleLeave = () => {
    gsap.to(fillRef.current, {
      height: "0%",
      duration: 0.4,
      ease: "power3.out",
    //   width: "0%",
    });
  };

  return (
    <button
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`relative overflow-hidden  bg-white px-${px} py-${py} rounded-full border border-white text-white`}
    >
      {/* Animated Background */}
      <span
        ref={fillRef}
        className="absolute bottom-0  left-0 w-full h-0 bg-white"
      ></span>

      {/* Text */}
      <span className="relative z-10 mix-blend-difference">{text}</span>
    </button>
  );
};

export default AnimatedButton;
