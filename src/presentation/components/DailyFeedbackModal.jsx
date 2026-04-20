import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, Bean, Coffee, Cookie, CupSoda, DollarSign, Info, Sparkles } from 'lucide-react';
import RollingNumber from './RollingNumber';

const toneClasses = {
  emerald: {
    shell: {
      light: 'border-emerald-300 bg-emerald-100',
      dark: 'border-emerald-500/50 bg-emerald-950',
    },
    icon: 'bg-emerald-900/50 text-emerald-400',
    title: 'text-emerald-500',
    button: 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20',
  },
  red: {
    shell: {
      light: 'border-red-300 bg-red-100',
      dark: 'border-red-500/50 bg-red-950',
    },
    icon: 'bg-red-900/50 text-red-400',
    title: 'text-red-500',
    button: 'bg-red-500 hover:bg-red-400 text-red-950 shadow-red-500/20',
  },
  blue: {
    shell: {
      light: 'border-blue-300 bg-blue-100',
      dark: 'border-blue-500/50 bg-blue-950',
    },
    icon: 'bg-blue-900/50 text-blue-400',
    title: 'text-blue-500',
    button: 'bg-blue-500 hover:bg-blue-400 text-blue-950 shadow-blue-500/20',
  },
};

const decorationIcons = [
  { Icon: Coffee, color: 'text-amber-500' },
  { Icon: Bean, color: 'text-orange-600' },
  { Icon: CupSoda, color: 'text-yellow-600' },
  { Icon: Cookie, color: 'text-amber-700' },
  { Icon: Sparkles, color: 'text-yellow-500' },
];

const seededUnit = (seed) => {
  const value = Math.sin(seed * 9301) * 10000;
  return value - Math.floor(value);
};

const DailyFeedbackModal = ({
  isOpen,
  feedback,
  theme,
  day,
  finalDay,
  onContinue,
}) => {
  const floatingIcons = React.useMemo(() => (
    Array.from({ length: 20 }, (_, index) => {
      const icon = decorationIcons[index % decorationIcons.length];
      const seed = (Number(day) || 1) * 100 + index;

      return {
        ...icon,
        id: `${day}-${index}`,
        left: 6 + seededUnit(seed + 1) * 88,
        top: 12 + seededUnit(seed + 2) * 78,
        size: 18 + seededUnit(seed + 3) * 20,
        delay: seededUnit(seed + 4) * 2.4,
        duration: 1.4 + seededUnit(seed + 5) * 1.8,
        rotate: -20 + seededUnit(seed + 6) * 40,
      };
    })
  ), [day]);

  if (!isOpen || !feedback) return null;

  const tone = toneClasses[feedback.color] || toneClasses.blue;
  const isLight = theme === 'theme-latte';
  const continueLabel = day >= finalDay ? 'Finish' : 'Next Day';

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-sm ${theme}`}>
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${isLight ? tone.shell.light : tone.shell.dark}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-feedback-title"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {floatingIcons.map(({ Icon, id, left, top, size, delay, duration, rotate, color }) => (
              <motion.div
                key={id}
                className={`absolute ${color}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                initial={{ opacity: 0, scale: 0.55, rotate }}
                animate={{
                  opacity: [0, isLight ? 0.42 : 0.34, 0],
                  scale: [0.72, 1.18, 0.86],
                  rotate: [rotate, rotate + 12, rotate - 8],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  repeatDelay: 1.4 + (delay % 1.2),
                  ease: 'easeInOut',
                }}
              >
                <Icon style={{ width: size, height: size }} strokeWidth={3} />
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 flex items-start justify-between gap-4 border-b border-coffee-700/40 p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`shrink-0 rounded-xl p-2.5 ${tone.icon}`}>
                {React.cloneElement(feedback.icon || <Info />, { className: 'h-6 w-6' })}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-coffee-400">
                  Day {day} Results
                </div>
                <h2 id="daily-feedback-title" className={`mt-1 text-xl font-black ${tone.title}`}>
                  {feedback.title}
                </h2>
                {feedback.message && (
                  <p className="mt-1 text-sm font-semibold leading-snug text-coffee-200">
                    {feedback.message}
                  </p>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onContinue}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wide shadow-lg transition-all ${tone.button}`}
            >
              <span className="inline-flex items-center gap-2">
                {continueLabel}
                <ArrowRight className="h-4 w-4" />
              </span>
            </motion.button>
          </div>

          <div className="custom-scrollbar relative z-10 overflow-y-auto p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                icon={<Coffee className="h-4 w-4" />}
                label="Cups Sold"
                value={<RollingNumber value={feedback.playerSales} />}
                className="border-yellow-300 bg-yellow-100/95 text-yellow-900 dark:bg-yellow-500/25 dark:border-yellow-400/40 dark:text-yellow-100"
              />
              <MetricCard
                icon={<DollarSign className="h-4 w-4" />}
                label="Profit"
                value={<RollingNumber value={feedback.value} decimals={2} prefix="$" />}
                className="border-emerald-300 bg-emerald-100/95 text-emerald-900 dark:bg-emerald-500/25 dark:border-emerald-400/40 dark:text-emerald-100"
              />
              <MetricCard
                label="Net Reward"
                value={<RollingNumber value={feedback.playerReward ?? 0} decimals={1} />}
                className="border-violet-300 bg-violet-100/95 text-violet-900 dark:bg-violet-500/25 dark:border-violet-400/40 dark:text-violet-100"
              />
            </div>

            {feedback.showZeroMarginInsight && (
              <div className={`mt-4 rounded-lg border border-red-500/40 px-3 py-2.5 shadow-md ${isLight ? 'bg-red-100 text-red-900' : 'bg-red-900/30 text-red-100'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-xs font-semibold leading-snug">
                    Since the cost per cup is $1.00 and you priced coffee at $1.00, this day ends with zero profit.
                  </p>
                </div>
              </div>
            )}

            {feedback.educationalTip && (
              <div className="mt-4 rounded-lg border-l-4 border-amber-600 bg-coffee-950/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wide text-amber-600">
                    {feedback.educationalTip.title}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-relaxed text-coffee-100">
                  {feedback.educationalTip.text}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const MetricCard = ({ icon = null, label, value, className }) => (
  <div className={`flex min-h-[86px] flex-col items-center justify-center rounded-lg border px-3 py-3 text-center shadow-md ${className}`}>
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-2xl font-black leading-none">{value}</span>
    </div>
    <span className="mt-2 text-[9px] font-black uppercase tracking-widest leading-none opacity-85">
      {label}
    </span>
  </div>
);

export default DailyFeedbackModal;
