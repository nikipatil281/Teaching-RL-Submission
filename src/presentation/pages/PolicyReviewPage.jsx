import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { TableProperties, ArrowLeft, Download, Sun, Moon, ChevronRight, Check, X, Minus, BarChart3 } from 'lucide-react';

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const POLICY_MATCH_LABELS = {
    full: 'In range',
    partial: 'Partial',
    none: 'Out of range',
};
const PLAYER_COLOR = '#10b981';
const ML_COLOR = '#1d4ed8';
const RL_COLOR = '#f97316';
const DAILY_COMPARISON_LEGEND = [
    { value: 'You', type: 'square', color: PLAYER_COLOR },
    { value: 'ML Agent', type: 'square', color: ML_COLOR },
    { value: 'RL Agent', type: 'square', color: RL_COLOR },
];

const DailyComparisonTooltip = ({ active, payload, label, valuePrefix = '' }) => {
    if (!(active && payload && payload.length)) return null;

    return (
        <div className="min-w-[200px] rounded-lg border border-coffee-700 bg-coffee-900/95 p-3 shadow-xl">
            <p className="mb-2 text-sm font-bold text-coffee-100">{label}</p>
            <div className="space-y-1.5 text-xs text-coffee-300">
                {payload.map((entry) => (
                    <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                        <span className="font-semibold" style={{ color: entry.color }}>
                            {entry.name}
                        </span>
                        <span className="font-mono text-coffee-100">
                            {valuePrefix}{Number(entry.value ?? 0).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PolicyReviewPage = ({ history, theme, toggleTheme, onBackToDebrief, onNext }) => {
    const [isExporting, setIsExporting] = useState(false);

    if (!history || history.length < 2) return null;

    const getPlayerPriceRange = (state) => {
        if (state.minPrice === null || state.maxPrice === null) return 'N/A';
        return state.minPrice === state.maxPrice
            ? `$${state.minPrice.toFixed(2)}`
            : `$${state.minPrice.toFixed(2)} - $${state.maxPrice.toFixed(2)}`;
    };

    const handleExportPolicyPDF = () => {
        setIsExporting(true);
        try {
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const titleHeight = 15;
            const tableX = margin;
            const tableY = margin + titleHeight;
            const tableWidth = pageWidth - (margin * 2);
            const tableHeight = pageHeight - tableY - margin;
            const headers = ['Weather', 'Day(s)', 'Range of Starting Inventory', 'Local Event', 'Competitor', "RL's Learned Range", 'Your Price Range', 'Range Match'];
            const columnFractions = [0.12, 0.09, 0.14, 0.12, 0.14, 0.15, 0.15, 0.09];
            const columnWidths = columnFractions.map((fraction) => tableWidth * fraction);
            const rows = [...playerPolicyTable].sort((a, b) => b.count - a.count);
            const rowHeight = tableHeight / Math.max(rows.length + 1, 2);
            const bodyFontSize = Math.min(8.5, Math.max(5.5, rowHeight * 0.44));
            const headerFontSize = Math.min(7.5, Math.max(5.5, rowHeight * 0.42));

            const colors = {
                page: [246, 238, 228],
                panel: [35, 29, 24],
                header: [26, 21, 18],
                grid: [93, 75, 63],
                text: [248, 241, 232],
                muted: [195, 176, 161],
                amber: [245, 158, 11],
                orange: [251, 146, 60],
                emerald: [52, 211, 153],
                red: [248, 113, 113],
            };

            const drawCellText = (text, x, y, width, height, align = 'left', color = colors.text, font = 'normal') => {
                pdf.setFont('helvetica', font);
                pdf.setFontSize(bodyFontSize);
                pdf.setTextColor(...color);
                const maxWidth = width - 3;
                const lines = pdf.splitTextToSize(String(text), maxWidth).slice(0, Math.max(1, Math.floor(height / (bodyFontSize * 0.45))));
                const lineHeight = bodyFontSize * 0.42;
                const blockHeight = (lines.length - 1) * lineHeight;
                let textY = y + (height / 2) - (blockHeight / 2) + (bodyFontSize * 0.32);
                lines.forEach((line) => {
                    const textX = align === 'right' ? x + width - 1.5 : align === 'center' ? x + (width / 2) : x + 1.5;
                    pdf.text(line, textX, textY, { align });
                    textY += lineHeight;
                });
            };

            const drawMatchIcon = (match, x, y, width, height) => {
                const cx = x + (width / 2);
                const cy = y + (height / 2);
                const size = Math.min(width, height) * 0.18;

                if (match === 'full') {
                    pdf.setDrawColor(...colors.emerald);
                    pdf.setLineWidth(1.2);
                    pdf.line(cx - size, cy, cx - (size * 0.25), cy + size * 0.75);
                    pdf.line(cx - (size * 0.25), cy + size * 0.75, cx + size * 1.2, cy - size * 0.9);
                    return;
                }

                if (match === 'partial') {
                    pdf.setDrawColor(...colors.amber);
                    pdf.setLineWidth(1.2);
                    pdf.line(cx - size, cy, cx + size, cy);
                    return;
                }

                pdf.setDrawColor(...colors.red);
                pdf.setLineWidth(1.2);
                pdf.line(cx - size, cy - size, cx + size, cy + size);
                pdf.line(cx + size, cy - size, cx - size, cy + size);
            };

            pdf.setFillColor(...colors.page);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            pdf.setTextColor(31, 22, 18);
            pdf.text('Pricing Policy Summary - RL and You', margin, margin + 6);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(101, 79, 67);
            pdf.text('Reinforcement Learning Optimal Policy Review', margin, margin + 11);

            pdf.setFillColor(...colors.panel);
            pdf.roundedRect(tableX, tableY, tableWidth, tableHeight, 2, 2, 'F');

            let currentX = tableX;
            pdf.setFillColor(...colors.header);
            pdf.rect(tableX, tableY, tableWidth, rowHeight, 'F');
            headers.forEach((header, index) => {
                const width = columnWidths[index];
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(headerFontSize);
                pdf.setTextColor(...(index === 5 ? colors.orange : index === 6 ? colors.emerald : colors.muted));
                pdf.text(pdf.splitTextToSize(header, width - 3), currentX + (width / 2), tableY + (rowHeight / 2) + 1, { align: 'center' });
                currentX += width;
            });

            rows.forEach((state, rowIndex) => {
                const y = tableY + rowHeight + (rowIndex * rowHeight);
                const values = [
                    state.weather,
                    state.dayDistributionString,
                    state.inventoryRangeString,
                    state.event ? 'Yes' : 'No',
                    state.competitor ? state.competitorRangeStr : 'No',
                    state.rlRangeString,
                    getPlayerPriceRange(state),
                ];
                currentX = tableX;
                values.forEach((value, index) => {
                    const width = columnWidths[index];
                    pdf.setFillColor(rowIndex % 2 === 0 ? 42 : 36, rowIndex % 2 === 0 ? 35 : 30, rowIndex % 2 === 0 ? 29 : 25);
                    pdf.rect(currentX, y, width, rowHeight, 'F');
                    const align = [2, 3, 4].includes(index) ? 'center' : [5, 6].includes(index) ? 'right' : 'left';
                    const color = index === 5 ? colors.orange : index === 6 ? colors.emerald : colors.text;
                    drawCellText(value, currentX, y, width, rowHeight, align, color, [5, 6].includes(index) ? 'bold' : 'normal');
                    currentX += width;
                });

                const iconWidth = columnWidths[columnWidths.length - 1];
                pdf.setFillColor(rowIndex % 2 === 0 ? 42 : 36, rowIndex % 2 === 0 ? 35 : 30, rowIndex % 2 === 0 ? 29 : 25);
                pdf.rect(currentX, y, iconWidth, rowHeight, 'F');
                drawMatchIcon(state.policyMatch, currentX, y, iconWidth, rowHeight);
            });

            pdf.setDrawColor(...colors.grid);
            pdf.setLineWidth(0.25);

            let gridX = tableX;
            pdf.line(gridX, tableY, gridX, tableY + tableHeight);
            columnWidths.forEach((width) => {
                gridX += width;
                pdf.line(gridX, tableY, gridX, tableY + tableHeight);
            });

            for (let rowIndex = 0; rowIndex <= rows.length + 1; rowIndex += 1) {
                const gridY = tableY + (rowIndex * rowHeight);
                pdf.line(tableX, gridY, tableX + tableWidth, gridY);
            }

            pdf.save('pricing_policy_summary.pdf');
        } catch (error) {
            console.error("Failed to export policy PDF", error);
        } finally {
            setIsExporting(false);
        }
    };

    const playerPolicyMap = {};
    history.filter(h => h.day !== 'Start').forEach(record => {
        const stateKey = `${record.weather}_${record.nearbyEvent}_${record.competitorPresent}`;

        if (!playerPolicyMap[stateKey]) {
            playerPolicyMap[stateKey] = {
                weather: record.weather,
                event: record.nearbyEvent,
                competitor: record.competitorPresent,
                competitorPrices: [],
                prices: [],
                rlPrices: [],
                dayCounts: {},
                startInventories: [],
            };
        }

        if (record.playerPrice) {
            playerPolicyMap[stateKey].prices.push(record.playerPrice);
        }
        if (record.competitorPresent && Number.isFinite(record.competitorPrice)) {
            playerPolicyMap[stateKey].competitorPrices.push(record.competitorPrice);
        }
        if (record.rlPrice) {
            playerPolicyMap[stateKey].rlPrices.push(record.rlPrice);
        }
        if (record.dayName) {
            playerPolicyMap[stateKey].dayCounts[record.dayName] = (playerPolicyMap[stateKey].dayCounts[record.dayName] || 0) + 1;
        }
        if (Number.isFinite(record.startInventory)) {
            playerPolicyMap[stateKey].startInventories.push(record.startInventory);
        }
    });

    // Calculate distributions for each state
    const playerPolicyTable = Object.values(playerPolicyMap).map(state => {
        const minPrice = state.prices.length > 0 ? Math.min(...state.prices) : null;
        const maxPrice = state.prices.length > 0 ? Math.max(...state.prices) : null;
        const rlMinPrice = state.rlPrices.length > 0 ? Math.min(...state.rlPrices) : null;
        const rlMaxPrice = state.rlPrices.length > 0 ? Math.max(...state.rlPrices) : null;
        const competitorMin = state.competitorPrices.length > 0 ? Math.min(...state.competitorPrices) : null;
        const competitorMax = state.competitorPrices.length > 0 ? Math.max(...state.competitorPrices) : null;

        const groupedDays = Object.entries(state.dayCounts)
            .sort((a, b) => WEEKDAY_ORDER.indexOf(a[0]) - WEEKDAY_ORDER.indexOf(b[0]));
        const minInventory = state.startInventories.length > 0 ? Math.min(...state.startInventories) : null;
        const maxInventory = state.startInventories.length > 0 ? Math.max(...state.startInventories) : null;
        const hasFullMatch = minPrice !== null && maxPrice !== null && rlMinPrice !== null && rlMaxPrice !== null
            && minPrice >= rlMinPrice
            && maxPrice <= rlMaxPrice;
        const hasPartialMatch = !hasFullMatch
            && minPrice !== null
            && maxPrice !== null
            && rlMinPrice !== null
            && rlMaxPrice !== null
            && Math.max(minPrice, rlMinPrice) <= Math.min(maxPrice, rlMaxPrice);

        return {
            ...state,
            groupedDays,
            dayDistributionString: groupedDays.length > 0
                ? groupedDays
                    .map(([dayName]) => dayName.slice(0, 2))
                    .join(', ')
                : 'N/A',
            inventoryRangeString: minInventory === null
                ? 'N/A'
                : minInventory === maxInventory
                    ? `${minInventory}`
                    : `${minInventory} - ${maxInventory}`,
            competitorRangeStr: !state.competitor
                ? 'No'
                : competitorMin === competitorMax
                    ? `$${competitorMin?.toFixed(2)}`
                    : `$${competitorMin?.toFixed(2)} - $${competitorMax?.toFixed(2)}`,
            minPrice,
            maxPrice,
            rlRangeString: rlMinPrice === null
                ? 'N/A'
                : rlMinPrice === rlMaxPrice
                    ? `$${rlMinPrice.toFixed(2)}`
                    : `$${rlMinPrice.toFixed(2)} - $${rlMaxPrice.toFixed(2)}`,
            policyMatch: hasFullMatch ? 'full' : hasPartialMatch ? 'partial' : 'none',
            count: state.prices.length
        };
    });

    const dailyGameplayData = history
        .filter((record) => record.day !== 'Start')
        .map((record) => ({
            label: record.dayName ? `${record.dayName.slice(0, 3)} (${record.day.replace('Day ', 'D')})` : record.day,
            playerPrice: Number(record.playerPrice ?? 0),
            mlPrice: Number(record.mlPrice ?? 0),
            rlPrice: Number(record.rlPrice ?? 0),
            playerDailyProfit: Number(record.playerDailyProfit ?? 0),
            mlDailyProfit: Number(record.mlDailyProfit ?? 0),
            rlDailyProfit: Number(record.rlDailyProfit ?? 0),
        }));

    return (
        <div className={`min-h-screen bg-coffee-950 text-coffee-100 p-4 md:p-6 xl:p-8 flex flex-col items-center animate-in fade-in duration-500 overflow-y-auto ${theme}`}>
            {/* Header / Actions */}
            <div className="w-full max-w-[1500px] flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, x: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBackToDebrief}
                        className="flex items-center gap-2 text-coffee-300 hover:text-coffee-100 transition-colors bg-coffee-800/50 hover:bg-coffee-700/50 px-4 py-2 rounded-lg border border-coffee-700/50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Debrief
                    </motion.button>
                </div>

                <div className="flex gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExportPolicyPDF}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? "Exporting..." : "Export policy as PDF"}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onNext}
                        className="bg-amber-600 hover:bg-amber-500 text-coffee-950 font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all flex items-center gap-2"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 bg-coffee-800/50 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700/50 transition-all text-coffee-200"
                    >
                        {theme === 'theme-latte' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Main Content Area to Export */}
            <div className="w-full max-w-[1500px] flex flex-col items-center bg-coffee-900 p-6 md:p-8 rounded-2xl border border-coffee-700 shadow-2xl relative">
                <div className="flex items-center gap-3 mb-8">
                    <TableProperties className="w-8 h-8 text-emerald-400" />
                    <h2 className="text-3xl font-bold text-coffee-100">Reinforcement Learning Optimal Policy Review</h2>
                </div>

                {/* Player Policy Summary Table */}
                <div className="w-full flex-1 flex flex-col mb-4 bg-coffee-800 border border-coffee-700 rounded-xl overflow-hidden">
                    <div className="p-5 md:p-6 bg-coffee-900/50 border-b border-coffee-700">
                        <h3 className="text-xl md:text-2xl font-bold text-amber-400 flex items-center gap-3">
                            <TableProperties className="w-6 h-6" />
                            Pricing Policy Summary - RL and You
                        </h3>
                        <p className="text-sm text-coffee-400 mt-2">Discover the prefered price range across different market states. Variables that affect demand are accounted for.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-coffee-200">
                            <thead className="bg-coffee-900/30 text-coffee-400 uppercase text-[11px] sticky top-0">
                                <tr>
                                    <th className="px-4 py-3.5 font-bold border-b border-coffee-700 text-left whitespace-nowrap">Weather</th>
                                    <th className="px-4 py-3.5 font-bold border-b border-coffee-700 text-left whitespace-nowrap">Day(s)</th>
                                    <th className="px-4 py-3.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Range of Starting Inventory</th>
                                    <th className="px-4 py-3.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Local Event</th>
                                    <th className="px-4 py-3.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Competitor</th>
                                    <th className="px-4 py-3.5 font-bold border-b border-coffee-700 text-right text-orange-400 whitespace-nowrap">RL's Learned Range</th>
                                    <th className="px-4 py-3.5 font-bold border-b border-coffee-700 text-right text-emerald-400 whitespace-nowrap">Your Price Range</th>
                                    <th className="px-4 py-3.5 font-bold border-b border-coffee-700 text-center">
                                        <div className="group relative flex justify-center">
                                            <span className="cursor-help">Range Match</span>
                                            <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-coffee-700 bg-coffee-950/95 px-3 py-2 text-[10px] font-medium normal-case text-coffee-300 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
                                                <p className="text-center leading-snug">
                                                    Shows whether your chosen range matched the RL agent&apos;s optimal range.
                                                </p>
                                                <div className="mt-2 grid gap-1.5">
                                                    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                        in range
                                                    </span>
                                                    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <Minus className="w-3 h-3 text-amber-400" />
                                                        partial
                                                    </span>
                                                    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                                                        <X className="w-3 h-3 text-red-400" />
                                                        out of range
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-coffee-700/50">
                                {playerPolicyTable.length > 0 ? (
                                    playerPolicyTable.sort((a, b) => b.count - a.count).map((state, idx) => (
                                        <tr key={idx} className="hover:bg-coffee-700/20 transition-colors">
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className={`font-medium text-sm px-2.5 py-1.5 rounded bg-coffee-900 border border-coffee-700 ${state.weather === 'Sunny' ? 'text-amber-400' : 'text-blue-300'}`}>
                                                    {state.weather}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-left text-sm text-coffee-300 whitespace-nowrap">
                                                {state.dayDistributionString}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono text-sm text-coffee-300 whitespace-nowrap">
                                                {state.inventoryRangeString}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {state.event ? (
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold">Yes</span>
                                                ) : (
                                                    <span className="text-coffee-500 text-sm">No</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {state.competitor ? (
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold whitespace-nowrap">
                                                        {state.competitorRangeStr}
                                                    </span>
                                                ) : (
                                                    <span className="text-coffee-500 text-sm">No</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-orange-400 text-sm font-bold bg-orange-500/5 whitespace-nowrap">
                                                {state.rlRangeString}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-emerald-400 text-sm font-bold bg-emerald-500/5 whitespace-nowrap">
                                                {state.minPrice === null || state.maxPrice === null
                                                    ? 'N/A'
                                                    : state.minPrice === state.maxPrice
                                                    ? `$${state.minPrice.toFixed(2)}`
                                                    : `$${state.minPrice.toFixed(2)} - $${state.maxPrice.toFixed(2)}`}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {state.policyMatch === 'full' ? (
                                                    <Check className="w-5 h-5 mx-auto text-emerald-400" />
                                                ) : state.policyMatch === 'partial' ? (
                                                    <Minus className="w-5 h-5 mx-auto text-amber-400" />
                                                ) : (
                                                    <X className="w-5 h-5 mx-auto text-red-400" />
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-coffee-500 italic">No pricing entries found yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="w-full flex flex-col bg-coffee-800 border border-coffee-700 rounded-xl overflow-hidden">
                    <div className="p-5 md:p-6 bg-coffee-900/50 border-b border-coffee-700">
                        <h3 className="text-xl md:text-2xl font-bold text-amber-400 flex items-center gap-3">
                            <BarChart3 className="w-6 h-6" />
                            Daily Gameplay Comparison
                        </h3>
                        <p className="text-sm text-coffee-400 mt-2">
                            Actual day-by-day actions and gross profits for you, the ML agent, and the RL agent.
                        </p>
                    </div>

                    <div className="grid gap-5 p-5 md:p-6">
                        <div className="rounded-xl border border-coffee-700 bg-coffee-900/35 p-4 md:p-5">
                            <div className="mb-4">
                                <h4 className="text-lg font-bold text-coffee-100">Daily Prices Set</h4>
                            </div>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyGameplayData} margin={{ top: 8, right: 20, left: 8, bottom: 8 }} barGap={2} barCategoryGap="28%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="label" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                        <YAxis
                                            stroke="#9ca3af"
                                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                                            label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10 }}
                                        />
                                        <Tooltip content={<DailyComparisonTooltip valuePrefix="$" />} />
                                        <Legend payload={DAILY_COMPARISON_LEGEND} wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                                        <Bar dataKey="playerPrice" name="You" fill={PLAYER_COLOR} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="mlPrice" name="ML Agent" fill={ML_COLOR} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="rlPrice" name="RL Agent" fill={RL_COLOR} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-xl border border-coffee-700 bg-coffee-900/35 p-4 md:p-5">
                            <div className="mb-4">
                                <h4 className="text-lg font-bold text-coffee-100">Daily Profits</h4>
                            </div>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyGameplayData} margin={{ top: 8, right: 20, left: 8, bottom: 8 }} barGap={2} barCategoryGap="28%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="label" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                        <YAxis
                                            stroke="#9ca3af"
                                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                                            label={{ value: 'Gross Profit ($)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10 }}
                                        />
                                        <Tooltip content={<DailyComparisonTooltip valuePrefix="$" />} />
                                        <Legend payload={DAILY_COMPARISON_LEGEND} wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                                        <Bar dataKey="playerDailyProfit" name="You" fill={PLAYER_COLOR} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="mlDailyProfit" name="ML Agent" fill={ML_COLOR} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="rlDailyProfit" name="RL Agent" fill={RL_COLOR} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PolicyReviewPage;
