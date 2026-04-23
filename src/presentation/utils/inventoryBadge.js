import { DAYS } from '../../domain/constants/marketConstants';

export const getDaysRemainingInWeek = (dayName) => {
  const dayIndex = DAYS.indexOf(dayName);
  if (dayIndex === -1) {
    return null;
  }

  return DAYS.length - dayIndex;
};

export const getInventoryBadgeText = (dayName, isDayEnd = false) => {
  if (isDayEnd) {
    return 'Remaining after sales';
  }

  const daysRemaining = getDaysRemainingInWeek(dayName);
  if (daysRemaining === null) {
    return 'Inventory for today';
  }

  if (daysRemaining === 1) {
    return 'Remaining for today';
  }

  return `Remaining for the next ${daysRemaining} days (including today)`;
};
