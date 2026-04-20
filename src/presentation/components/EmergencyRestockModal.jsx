import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, PackagePlus, DollarSign, ArrowRight } from 'lucide-react';

const EmergencyRestockModal = ({ isOpen, onRestock, theme }) => {
    const [selectedAmount, setSelectedAmount] = useState(200);

    const restockOptions = [
        { amount: 200, price: 275 },
        { amount: 350, price: 425 },
        { amount: 500, price: 575 },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden ${theme}`}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-coffee-900 border border-red-500/50 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden relative flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-900/80 to-coffee-900 p-6 border-b border-red-500/30 flex items-center gap-4">
                        <div className="bg-red-500/20 p-3 rounded-full border border-red-500/50">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-500 tracking-tight">Out of Stock!</h2>
                            <p className="text-red-200/80 text-sm mt-1">You must restock before continuing the week.</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        <div className="text-coffee-200 text-sm leading-relaxed text-center">
                            You sold out of your coffee supplies before the end of the week.
                            You need to pay an emergency overnight delivery fee to restock your inventory.
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {restockOptions.map((option) => (
                                <button
                                    key={option.amount}
                                    onClick={() => setSelectedAmount(option.amount)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedAmount === option.amount
                                        ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                        : 'bg-coffee-800 border-coffee-700 hover:border-amber-500/50 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <PackagePlus className={`w-6 h-6 ${selectedAmount === option.amount ? 'text-amber-500' : 'text-coffee-400'}`} />
                                        <span className={`font-bold text-lg ${selectedAmount === option.amount ? 'text-amber-500' : 'text-coffee-200'}`}>
                                            {option.amount} Cups
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-xl font-bold text-red-400">
                                        <DollarSign className="w-5 h-5 text-red-500/70" />
                                        {option.price.toFixed(0)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-coffee-950 flex justify-end border-t border-coffee-800">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                const selected = restockOptions.find(o => o.amount === selectedAmount);
                                onRestock(selected.amount, selected.price);
                            }}
                            className="bg-amber-600 hover:bg-amber-500 text-coffee-950 font-black py-3 px-8 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all text-lg w-full justify-center"
                        >
                            PAY & RESTOCK <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EmergencyRestockModal;
