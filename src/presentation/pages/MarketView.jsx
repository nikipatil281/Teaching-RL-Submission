import React, { useState } from 'react';
import { Sun, Cloud, CloudRain, Coffee, AlertTriangle, Users, Info } from 'lucide-react';
import { getDaysRemainingInWeek } from '../utils/inventoryBadge';

const WeatherIcon = ({ weather }) => {
  if (weather === 'Sunny') return <Sun className="w-8 h-8 text-yellow-500" />;
  if (weather === 'Cloudy') return <Cloud className="w-8 h-8 text-gray-400" />;
  if (weather === 'Rainy') return <CloudRain className="w-8 h-8 text-blue-400" />;

  return <Sun className="w-8 h-8 text-yellow-500" />;
};

const InventoryIcon = ({ isOutOfStock }) => {
  const [imageMissing, setImageMissing] = useState(false);
  const iconColor = isOutOfStock ? 'text-red-400' : 'text-amber-300';

  if (!imageMissing) {
    return (
      <img
        src="/coffee-beans-bag.webp"
        alt="Coffee beans inventory"
        onError={() => setImageMissing(true)}
        className={`w-13 h-12 object-contain ${isOutOfStock ? 'opacity-90' : ''}`}
      />
    );
  }

  return <Coffee className={`w-10 h-10 ${iconColor}`} />;
};

const EventIcon = ({ isActive }) => {
  const [imageMissing, setImageMissing] = useState(false);

  if (!isActive) {
    return <Info className="w-10 h-10 text-coffee-600/80" />;
  }

  const fallbackColor = 'text-amber-500';

  if (!imageMissing) {
    return (
      <img
        src="/local-events-icon.webp"
        alt="Local events"
        onError={() => setImageMissing(true)}
        className="absolute left-[10%] top-1/2 w-[180%] h-[180%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
      />
    );
  }

  return <AlertTriangle className={`absolute left-1/2 top-1/2 w-[128%] h-[128%] max-w-none -translate-x-1/2 -translate-y-1/2 ${fallbackColor}`} />;
};

const MarketView = ({ day, weather, inventory, isDayEnd, nearbyEvent, eventName, competitorPresent, competitorPrice, specialEvent }) => {
  const hasCompetitor = Boolean(competitorPresent);
  const daysRemaining = getDaysRemainingInWeek(day);

  return (
    <div className="bg-coffee-800 p-4 rounded-xl border border-coffee-700 shadow-xl relative overflow-hidden w-full">
      {/* Decor */}
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-coffee-300 flex items-center gap-2 relative z-10">
        <span className="text-lg">📅</span> Today's state
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.92fr_1.18fr_0.92fr_0.98fr]">
        {/* Day & Weather */}
        <div className="flex items-center justify-between bg-coffee-700/50 p-2 px-3 rounded-lg border border-transparent">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-coffee-400 font-bold mb-1">DAY AND WEATHER</div>
            <div className="text-xl font-bold text-coffee-100">{day}</div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[60px]">
            {React.cloneElement(WeatherIcon({ weather }), { className: "w-8 h-8 mb-1" })}
            <div className="text-[10px] text-coffee-400 font-bold uppercase tracking-tight">
              {weather}
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className={`flex items-center justify-between gap-3 p-2 px-3 rounded-lg border ${inventory <= 0 ? 'bg-red-900/20 border-red-500/50' : 'bg-coffee-700/50 border-transparent'}`}>
          <div className="flex min-w-0 flex-col">
            <div className="text-[10px] uppercase tracking-wider text-coffee-400 font-bold mb-1">Inventory</div>
            <div className={`text-lg font-mono font-bold ${inventory <= 0 ? 'text-red-500' : 'text-indigo-300'}`}>
              {inventory} <span className="text-xs text-coffee-500 font-normal">cups</span>
            </div>
            {inventory <= 0 && (
              <div className="max-w-full whitespace-normal break-words text-[11px] leading-snug text-red-300">
                OUT OF STOCK
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <InventoryIcon isOutOfStock={inventory <= 0} />
            {daysRemaining !== null && (
              <div className="flex w-[112px] shrink-0 flex-col items-center justify-center rounded-lg border border-coffee-600/70 bg-coffee-900/70 px-2 py-2 text-center shadow-inner">
                <div className={`text-lg font-black leading-none ${inventory <= 0 ? 'text-red-300' : 'text-amber-300'}`}>
                  {daysRemaining}
                </div>
                <div className="mt-1 text-[9px] font-semibold uppercase leading-tight text-coffee-300">
                  Days remaining
                </div>
                <div className="text-[9px] font-semibold uppercase leading-tight text-coffee-300">
                  in this week
                </div>
                <div className="text-[9px] font-semibold leading-tight text-coffee-400">
                  (including today)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Competitor */}
        <div className={`p-2 px-3 rounded-lg border flex items-start justify-between transition-colors ${hasCompetitor
          ? 'bg-red-900/10 border-red-500/50'
          : 'bg-coffee-700/50 border-transparent'
          }`}>
          <div className="flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-coffee-400 font-bold mb-1">Competition</div>
            <div className={`text-sm font-bold ${hasCompetitor ? 'text-red-600' : 'text-coffee-400'}`}>
              {hasCompetitor ? `Competitor @ $${competitorPrice?.toFixed(2)}` : specialEvent ? 'Competitor Absent' : 'Market Clear'}
            </div>
            <div className={`text-[10px] mt-1 text-coffee-400`}>
              {hasCompetitor
                ? <span>"BeanMean" is open</span>
                  : specialEvent
                  ? <span className="italic line-clamp-1">{specialEvent}</span>
                  : <span>No competition</span>
              }
            </div>
          </div>
          <div className="relative">
            <Users className={`w-8 h-8 ${hasCompetitor ? 'text-red-500' : 'text-coffee-500/60'}`} />
          </div>
        </div>

        {/* Event */}
        <div className={`p-2 px-3 rounded-lg border flex items-center justify-between ${nearbyEvent ? 'bg-amber-900/30 border-amber-700/50' : 'bg-coffee-700/50 border-transparent'}`}>
          <div className="flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-coffee-400 font-bold mb-1">Local Events</div>
            <div className={`text-sm font-bold ${nearbyEvent ? 'text-amber-400' : 'text-coffee-400'}`}>
              {nearbyEvent ? (eventName || 'Event Detected!') : 'Quiet Street'}
            </div>
            <div className={`text-[10px] mt-1 text-coffee-400`}>
              {nearbyEvent ? 'Higher footfall expected' : 'Normal traffic levels'}
            </div>
          </div>
          <div className="relative shrink-0 self-center h-[68px] w-[68px] overflow-visible">
            <EventIcon isActive={nearbyEvent} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketView;
