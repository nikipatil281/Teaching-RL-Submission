import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardCheck, LogOut, Moon, RotateCcw, Sun } from 'lucide-react';
import RLPipelineFlow from '../components/RLPipelineFlow';

const RLPipelinePage = ({
    theme,
    toggleTheme,
    onBackToPolicyReview,
    onGoToQuiz,
    onRestart,
    onExitToLogin,
    hasRestartedSimulation = false,
}) => {
    return (
        <div className={`min-h-screen bg-coffee-950 text-coffee-100 p-4 md:p-5 flex flex-col animate-in fade-in duration-500 overflow-y-auto ${theme}`}>
            <div className="w-full flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05, x: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBackToPolicyReview}
                        className="flex items-center gap-2 text-coffee-300 hover:text-coffee-100 transition-colors bg-coffee-800/50 hover:bg-coffee-700/50 px-4 py-2 rounded-lg border border-coffee-700/50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Policy Review
                    </motion.button>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-coffee-100">How the RL Pipeline Works</h2>
                        <p className="text-sm text-coffee-300 mt-1">
                            A full-screen view of how the agent observes the market, chooses a price, receives feedback, and updates its policy.
                        </p>
                    </div>
                </div>

                <button
                    onClick={toggleTheme}
                    className="p-2 bg-coffee-800/50 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700/50 transition-all text-coffee-200 shrink-0"
                >
                    {theme === 'theme-latte' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex-1 flex flex-col rounded-[32px] border border-coffee-700 bg-coffee-900/90 shadow-2xl overflow-hidden min-h-[calc(100vh-172px)]">
                <div className="px-5 pt-4 pb-3 border-b border-coffee-700/70 bg-coffee-950/35">
                    <p className="text-xs md:text-sm text-coffee-300">
                        Click the pipeline cards to pin their explanations. The zoom lens has been removed here so the flow stays large and clear.
                    </p>
                </div>

                <div className="flex-1 p-2 md:p-3">
                    <RLPipelineFlow
                        theme={theme}
                        showLensToggle={false}
                        defaultLensEnabled={false}
                        desktopHeightClass="h-[calc(100vh-220px)]"
                        fitViewOptions={{ padding: 0.015, maxZoom: 1.28 }}
                    />
                </div>
            </div>

            <div className="w-full mt-4 flex flex-wrap items-center justify-end gap-3">
                {!hasRestartedSimulation && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRestart}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Run Simulation Again
                    </motion.button>
                )}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onGoToQuiz}
                    className="bg-amber-600 hover:bg-amber-500 text-coffee-950 font-bold py-2.5 px-4 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all flex items-center gap-2"
                >
                    <ClipboardCheck className="w-4 h-4" />
                    Go to Quiz
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onExitToLogin}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.28)] transition-all flex items-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Exit the Session
                </motion.button>
            </div>
        </div>
    );
};

export default RLPipelinePage;
