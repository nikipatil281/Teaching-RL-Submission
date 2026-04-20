import React, { useState } from 'react';
import { Coffee, ArrowRight, BrainCircuit, Target, Trophy, Sun, Moon, MapPin, Info, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = ({ onJoin, theme, toggleTheme, userName }) => {
  const [userNameInput] = useState(userName || 'Entrepreneur');

  const handleJoin = (e) => {
    e.preventDefault();
    onJoin('You', userNameInput);
  };

  return (
    <div className={`min-h-screen bg-coffee-900 text-coffee-100 flex flex-col items-center p-4 md:p-8 relative overflow-x-hidden overflow-y-auto transition-colors duration-500 ${theme}`}>

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-coffee-700 bg-coffee-800 hover:bg-coffee-700 transition-colors text-xs font-bold shadow-md"
        >
          {theme === 'theme-black-coffee' ? <><Sun className="w-4 h-4 text-amber-500" /> Latte</> : <><Moon className="w-4 h-4 text-blue-300" /> Black Coffee</>}
        </button>
      </div>

      {/* Doodle Pattern Overlay */}
      <div className={`fixed inset-0 pointer-events-none bg-doodle-mask z-0 transition-all duration-500 ${theme === 'theme-black-coffee' ? 'bg-amber-100 opacity-[0.07] mix-blend-screen' : 'bg-amber-900 opacity-[0.1] mix-blend-luminosity'}`} />

      {/* Background Decor */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-40 mix-blend-screen' : 'opacity-60 mix-blend-color-burn'}`}>
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-amber-900/30 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-orange-900/20 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
      </div>

      <div className="z-10 w-full max-w-6xl flex flex-1 min-h-0 flex-col items-center justify-center py-6 md:py-8 gap-5 md:gap-8">

        {/* Title Section */}
        <div className="text-center mb-4 md:mb-8">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-block relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <h1 className="relative font-black flex flex-col items-center justify-center tracking-tighter">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-coffee-800/80 rounded-2xl border border-amber-500/20 shadow-xl backdrop-blur-md">
                  <Coffee className="w-10 h-10 md:w-14 md:h-14 text-amber-500" />
                </div>
                <span className="text-4xl md:text-7xl bg-gradient-to-b from-amber-300 via-amber-500 to-orange-700 bg-clip-text text-transparent drop-shadow-2xl">
                  ROAST & REWARD
                </span>
              </div>
              <span className="text-base md:text-xl font-bold text-coffee-100/60 mt-3 tracking-[0.2em] uppercase">Reinforcement Learning Simulation</span>
            </h1>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 w-full max-w-[68rem] items-stretch mx-auto min-h-0">

          {/* Left Column: Welcome Action */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 25, delay: 0.1 }}
              className="bg-coffee-800/40 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-amber-500/10 w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col items-center text-center group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-30" />
              
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-20 h-20 bg-coffee-950/80 rounded-[2rem] flex items-center justify-center border border-amber-500/30 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <Target className="w-10 h-10 text-amber-500" />
                </div>
              </div>

              <h2 className="text-4xl md:text-5xl font-black mb-4 text-coffee-100 tracking-tight leading-none">
                Ready to brew <span className="text-amber-500 italic">success?</span>
              </h2>
              <p className="text-coffee-300 text-base md:text-lg mb-10 max-w-sm leading-relaxed">
                Inherit your dream cafe, master dynamic pricing, and outsmart the competition in this AI-driven simulation.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full mb-10">
                {[
                  { icon: <BrainCircuit className="w-4 h-4" />, label: "AI Engine" },
                  { icon: <TrendingUp className="w-4 h-4" />, label: "Real Analytics" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-center gap-2 px-4 py-2 bg-coffee-900/50 rounded-xl border border-coffee-700/50 text-coffee-400 text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-amber-500">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>

              <form onSubmit={handleJoin} className="w-full relative z-10">
                <motion.button
                  whileHover={{ scale: 1.05, translateY: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className={`w-full bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-400 hover:to-orange-500 ${theme === 'theme-black-coffee' ? 'text-coffee-950' : 'text-coffee-100'} font-black text-xl py-5 rounded-[1.5rem] flex items-center justify-center gap-4 shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] transition-all group`}
                >
                  START SIMULATION <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </motion.button>
              </form>
            </motion.div>
          </div>

          {/* Right Column: Visual Layout */}
          <div className="flex min-h-0 flex-col justify-center">
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 25, delay: 0.2 }}
              className="relative p-2 rounded-[2.5rem] bg-gradient-to-br from-amber-500/20 to-transparent shadow-2xl h-full lg:h-[90%] overflow-hidden"
            >
              <div className="absolute inset-0 bg-coffee-900/40 backdrop-blur-sm z-10 opacity-0 hover:opacity-100 transition-opacity duration-700 flex items-center justify-center p-8">
                <p className="text-coffee-100 text-center font-bold text-xl leading-relaxed italic border-l-4 border-amber-500 pl-6">
                  "The secret to a great business is finding the perfect balance between art and analytics."
                </p>
              </div>
              <div className="w-full h-full rounded-[2rem] overflow-hidden border border-coffee-700/50 relative">
                <img
                  src="/cafe_interior.png"
                  alt="Modern Cafe Interior"
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-[2000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-coffee-950 via-transparent to-transparent opacity-80" />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
