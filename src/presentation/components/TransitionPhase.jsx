import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TransitionPhase = ({ onComplete, theme }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000); // 5 seconds transition

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((current) => (current > 1 ? current - 1 : current));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  return (
    <div className={`h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center relative overflow-y-auto transition-colors duration-500 ${theme}`}>
      <style>
        {`
          .transition-mug-loader {
            position: relative;
            width: 76px;
            height: 84px;
          }

          .transition-mug-loader .transition-mug-container {
            position: absolute;
            top: 40%;
            left: 50%;
            width: 76px;
            height: 72px;
            transform: translate(-50%, 0);
          }

          .transition-mug-loader .transition-mug-steam {
            position: absolute;
            top: -50%;
            left: 50%;
            width: 72px;
            height: 50px;
            z-index: 44;
            opacity: 0.8;
            display: flex;
            filter: blur(10px);
            -webkit-filter: blur(10px);
            transform: translateX(-50%);
            animation: transition-steam-drift 4.6s ease-in-out infinite alternate;
          }

          .transition-mug-loader .transition-mug-steam::before {
            content: "";
            width: 72px;
            height: 50px;
            background-color: white;
            animation: transition-fade-out-up linear 5s infinite forwards;
            clip-path: polygon(
              33% 40%,
              52% 12%,
              84% 29%,
              62% 65%,
              54% 89%,
              73% 92%,
              73% 74%,
              53% 63%,
              77% 57%,
              95% 31%,
              71% 3%,
              34% 47%,
              50% 37%,
              69% 39%,
              69% 29%,
              76% 35%,
              61% 6%,
              64% 47%,
              91% 9%,
              51% 5%,
              84% 61%,
              91% 49%,
              35% 19%,
              40% 10%,
              57% 41%,
              57% 54%,
              92% 19%
            );
            border-radius: 60% 50%;
          }

          .transition-mug-loader .transition-mug {
            position: relative;
            width: 76px;
            height: 72px;
            background-color: rgba(255, 245, 245, 1);
            border-radius: 5px 5px 50% 50%;
            box-shadow: inset -5px -1px 0px 3px rgba(239, 234, 234, 1);
            -webkit-box-shadow: inset -5px -1px 0px 3px rgba(239, 234, 234, 1);
          }

          .transition-mug-loader .transition-mug::before {
            position: absolute;
            display: block;
            width: 76px;
            height: 13px;
            content: "";
            border-radius: 50%;
            top: -6px;
            left: 0;
            z-index: 2;
            box-shadow:
              inset 2px 2px 0 0 rgb(245 245 245 / 50%),
              inset 0 0 0 1.5px rgb(255 245 245),
              inset 0 3px 0 1px rgb(225 225 225);
            -webkit-box-shadow:
              inset 2px 2px 0 0 rgb(245 245 245 / 50%),
              inset 0 0 0 1.5px rgb(255 245 245),
              inset 0 3px 0 1px rgb(225 225 225);
          }

          .transition-mug-loader .transition-mug-coffee {
            position: absolute;
            width: 72px;
            height: 11px;
            top: -6px;
            left: 0;
            border-radius: 50%;
            background: rgba(44, 31, 22, 1);
          }

          .transition-mug-loader .transition-mug-handle {
            position: absolute;
            top: 50%;
            left: -25%;
            transform: translateY(-50%) rotate(360deg);
            width: 32px;
            height: 32px;
            border-radius: 35px 5px 15px 80%;
            border: 6px solid #fff5f5;
            z-index: -1;
            box-shadow:
              1px -2px 0px 0px rgba(239, 234, 234, 1),
              inset -1px -2px 0px 0px rgba(239, 234, 234, 1);
            -webkit-box-shadow:
              1px -2px 0px 0px rgba(239, 234, 234, 1),
              inset -1px -2px 0px 0px rgba(239, 234, 234, 1);
          }

          @keyframes transition-fade-out-up {
            0% {
              opacity: 0.6;
              transform: translate3d(0, -20%, 0);
            }
            20% {
              opacity: 0.3;
              transform: translate3d(0, -40%, 0);
            }
            40% {
              opacity: 0.4;
              transform: translate3d(0, -60%, 0);
            }
            60% {
              opacity: 0.3;
              transform: translate3d(0, -80%, 0);
            }
            80% {
              opacity: 0.4;
              transform: translate3d(0, -90%, 0);
            }
            90% {
              opacity: 0.2;
              transform: translate3d(0, -95%, 0);
            }
            100% {
              opacity: 0;
              transform: translate3d(0, -100%, 0);
            }
          }

          @keyframes transition-steam-drift {
            0% {
              transform: translateX(-54%) translateY(2px) rotate(-4deg) scale(0.96);
              opacity: 0.72;
            }
            50% {
              transform: translateX(-48%) translateY(-4px) rotate(3deg) scale(1.03);
              opacity: 0.9;
            }
            100% {
              transform: translateX(-52%) translateY(-8px) rotate(-2deg) scale(0.98);
              opacity: 0.76;
            }
          }
        `}
      </style>

      {/* Doodle Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-amber-900 bg-doodle-mask opacity-[0.15] mix-blend-luminosity z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 my-auto flex flex-col items-center text-center px-4 pt-12 md:pt-16"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Time for the main Simulation!
        </h1>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4"
        >
          <div className="transition-mug-loader">
            <div className="transition-mug-container">
              <div className="transition-mug-steam" />
              <div className="transition-mug">
                <div className="transition-mug-coffee" />
              </div>
              <div className="transition-mug-handle" />
            </div>
          </div>
        </motion.div>
        <motion.div
          key={countdown}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-10 md:mt-12 mb-4 text-5xl md:text-6xl font-black text-amber-400"
        >
          {countdown}
        </motion.div>
        <p className="text-coffee-300 text-lg md:text-xl font-medium">
          Get ready to work alongside the Reinforcement Learning algorithm...
        </p>
      </motion.div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-color-burn">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-900/30 rounded-full blur-[150px] animate-blob" />
      </div>
    </div>
  );
};

export default TransitionPhase;
