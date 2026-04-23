import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardCheck, Sun, Moon, CheckCircle2, Download, LogOut, PlusCircle, Trash2, XCircle, RotateCcw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PriceSuggestionService } from '../../domain/services/PriceSuggestionService';

const POLICY_QUESTIONS = [
  {
    id: 'wastage',
    prompt: 'Why does leftover inventory matter at the end of the week?',
    options: [
      { value: 'higher_demand', label: 'Because leftover cups increase demand next week.' },
      { value: 'bonus_reward', label: 'Because leftover cups earn a bonus reward.' },
      { value: 'wastage_penalty', label: 'Because leftover cups lead to a wastage penalty.' },
    ],
    correctAnswer: 'wastage_penalty',
    explanation: 'Correct RL behavior must account for Sunday wastage, so excess inventory can reduce reward even if daily profit looked acceptable.',
  },
  {
    id: 'rainy_competitor',
    prompt: 'On a rainy day with a competitor present, what is usually a safer policy?',
    options: [
      { value: 'raise_far_above', label: 'Price far above the competitor.' },
      { value: 'stay_competitive', label: 'Stay competitive instead of pricing too high.' },
      { value: 'always_one_dollar', label: 'Always charge exactly $1.' },
    ],
    correctAnswer: 'stay_competitive',
    explanation: 'When traffic is weaker and a competitor is active, the RL policy usually stays competitive rather than giving away demand with an overly high price.',
  },
  {
    id: 'sequential',
    prompt: 'What makes this game a sequential decision problem?',
    options: [
      { value: 'same_day_only', label: 'Only the current day matters, not the future.' },
      { value: 'inventory_future', label: 'Today’s sales change the inventory you carry into future days.' },
      { value: 'weather_never_changes', label: 'The weather stays fixed for the whole game.' },
    ],
    correctAnswer: 'inventory_future',
    explanation: 'The agent is not solving isolated one-day tasks. Each choice changes future inventory and later opportunities.',
  },
  {
    id: 'event_pricing',
    prompt: 'When a nearby event increases demand, what does the RL policy often allow?',
    options: [
      { value: 'slightly_higher', label: 'A somewhat higher price because demand is stronger.' },
      { value: 'always_cheapest', label: 'The cheapest possible price regardless of context.' },
      { value: 'inventory_ignored', label: 'Inventory no longer matters on event days.' },
    ],
    correctAnswer: 'slightly_higher',
    explanation: 'Higher event traffic often supports stronger margins, so the learned policy can raise price somewhat instead of defaulting to discounting.',
  },
  {
    id: 'reward_vs_profit',
    prompt: 'How does reward differ from pure daily profit in this simulation?',
    options: [
      { value: 'equals_revenue', label: 'Reward is just another name for revenue.' },
      { value: 'ignores_inventory', label: 'Reward ignores inventory and wastage effects.' },
      { value: 'penalties_included', label: 'Reward also reflects penalties and target-based behavior, not just profit.' },
    ],
    correctAnswer: 'penalties_included',
    explanation: 'Net reward goes beyond gross profit. It also reflects RL-oriented penalties such as wastage, sell-out behavior, and other target conditions.',
  },
];

const TERMINOLOGY_QUESTIONS = [
  {
    id: 'state_term',
    prompt: 'In this simulation, what is the best description of a state?',
    options: [
      { value: 'weather_only', label: 'Only the weather condition for the day.' },
      { value: 'last_price_only', label: 'Only the price chosen on the previous day.' },
      { value: 'full_context', label: 'The market context the agent is in, such as weather, events, competition, and inventory.' },
    ],
    correctAnswer: 'full_context',
    explanation: 'A state is the context the agent uses to decide. Here that includes multiple variables, not just one signal like weather.',
  },
  {
    id: 'action_term',
    prompt: 'What is the main action the RL agent takes in this game?',
    options: [
      { value: 'choose_price', label: 'Choose the coffee price for that day.' },
      { value: 'change_weather', label: 'Change the weather to increase demand.' },
      { value: 'reset_inventory', label: 'Reset inventory at any time during the week.' },
    ],
    correctAnswer: 'choose_price',
    explanation: 'The action space in this simulation is centered on pricing decisions.',
  },
  {
    id: 'policy_term',
    prompt: 'Which statement best defines a policy?',
    options: [
      { value: 'one_time_score', label: 'A one-time score the agent gets after training.' },
      { value: 'mapping', label: 'A mapping from state to the action the agent tends to choose.' },
      { value: 'weather_forecast', label: 'A forecast of what the weather will be tomorrow.' },
    ],
    correctAnswer: 'mapping',
    explanation: 'A policy tells the agent what to do in each state. It is not the same thing as reward or prediction.',
  },
  {
    id: 'exploration_term',
    prompt: 'Which example is exploration?',
    options: [
      { value: 'repeat_best', label: 'Repeating the current best-known price every time.' },
      { value: 'skip_reward', label: 'Ignoring reward and choosing a random answer after the game ends.' },
      { value: 'try_uncertain', label: 'Trying a less-certain price to learn whether it performs better in that state.' },
    ],
    correctAnswer: 'try_uncertain',
    explanation: 'Exploration means testing less-certain actions to gather information that may improve later decisions.',
  },
  {
    id: 'exploitation_term',
    prompt: 'Which example is exploitation?',
    options: [
      { value: 'test_new', label: 'Testing a new price mainly to gather more information.' },
      { value: 'ignore_state', label: 'Ignoring the state and choosing the same price for every day.' },
      { value: 'use_known_good', label: 'Using the price that has already worked well in a familiar state.' },
    ],
    correctAnswer: 'use_known_good',
    explanation: 'Exploitation means leaning on what the agent already believes is the best option for the current state.',
  },
];

const ALL_QUESTIONS = [...TERMINOLOGY_QUESTIONS, ...POLICY_QUESTIONS];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEATHER_OPTIONS = ['Sunny', 'Cloudy', 'Rainy'];
const TRAFFIC_OPTIONS = ['normal with no events', 'high due to a nearby event'];
const MAX_SCENARIO_CHECKS = 5;
const RL_PRICE_TOLERANCE = 1;
const MIN_GAME_PRICE = 1;
const MAX_GAME_PRICE = 10;

const createScenarioCheck = (id) => ({
  id,
  day: 'Monday',
  weather: 'Sunny',
  traffic: 'normal with no events',
  competitor: 'absent',
  competitorPrice: '',
  optimalPrice: '',
});

const formatPriceRange = (minPrice, maxPrice) => {
  if (minPrice === maxPrice) {
    return `$${Number(minPrice).toFixed(2)}`;
  }
  return `$${Number(minPrice).toFixed(2)} to $${Number(maxPrice).toFixed(2)}`;
};

const normalizeScenarioPrice = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(Math.round(numeric)) : '';
};

const sanitizeScenarioPriceInput = (value) => {
  if (value === '') return '';

  const normalizedValue = normalizeScenarioPrice(value);
  if (normalizedValue === '') return '';

  const clampedValue = Math.min(MAX_GAME_PRICE, Math.max(MIN_GAME_PRICE, Number(normalizedValue)));
  return String(clampedValue);
};

const isWholeDollarInput = (value) => /^\d+$/.test(value);

const ALLOWED_SCENARIO_PRICE_KEYS = new Set([
  'Tab',
  'Enter',
  'Escape',
  'ArrowUp',
  'ArrowDown',
]);

const buildScenarioStateKey = ({ day, weather, nearbyEvent, competitorPresent, competitorPrice }) => (
  [
    String(day ?? '').trim(),
    String(weather ?? '').trim(),
    nearbyEvent ? 'event' : 'no-event',
    competitorPresent ? 'competitor' : 'no-competitor',
    competitorPresent ? normalizeScenarioPrice(competitorPrice) : '',
  ].join('|')
);

const buildEncounteredScenarioKeys = (history = []) => {
  const keys = new Set();

  history
    .filter((record) => record?.day !== 'Start')
    .forEach((record) => {
      keys.add(buildScenarioStateKey({
        day: record.dayName,
        weather: record.weather,
        nearbyEvent: record.nearbyEvent,
        competitorPresent: record.competitorPresent,
        competitorPrice: record.competitorPrice,
      }));
    });

  return keys;
};

const hasEncounteredScenario = (scenario, encounteredScenarioKeys) => {
  const competitorPresent = scenario.competitor === 'present';
  const scenarioKey = buildScenarioStateKey({
    day: scenario.day,
    weather: scenario.weather,
    nearbyEvent: scenario.traffic === 'high due to a nearby event',
    competitorPresent,
    competitorPrice: competitorPresent ? scenario.competitorPrice : null,
  });

  return encounteredScenarioKeys.has(scenarioKey);
};

const getScenarioLookupConditions = (scenario) => {
  const competitorPresent = scenario.competitor === 'present';
  return {
    day: scenario.day,
    weather: scenario.weather,
    nearbyEvent: scenario.traffic === 'high due to a nearby event',
    competitorPresent,
    competitorPrice: competitorPresent ? scenario.competitorPrice : 0,
  };
};

const getRangeFromRlPrice = (rlPrice) => ({
  minPrice: Math.max(MIN_GAME_PRICE, Number(rlPrice) - RL_PRICE_TOLERANCE),
  maxPrice: Math.min(MAX_GAME_PRICE, Number(rlPrice) + RL_PRICE_TOLERANCE),
});

const getScenarioEvaluation = (scenario, encounteredScenarioKeys, policyLookup) => {
  const optimalPrice = Number(scenario.optimalPrice);
  const wasEncountered = hasEncounteredScenario(scenario, encounteredScenarioKeys);

  if (policyLookup?.status !== 'ready') {
    const statusMessage = policyLookup?.status === 'missing'
      ? 'This combination is not a valid simulation state in the game, so it would not appear during a real run. No scenario point is awarded.'
      : 'We are still checking the best pricing range for this scenario.';

    return {
      isCorrect: false,
      isPolicyAligned: false,
      wasEncountered,
      rangeText: policyLookup?.status === 'missing' ? 'Invalid simulation state' : 'Checking scenario',
      feedbackTone: 'amber',
      feedbackTitle: policyLookup?.status === 'missing' ? 'Invalid simulation state' : 'Checking scenario',
      feedbackBody: statusMessage,
      rlPrice: null,
    };
  }

  const policyRange = getRangeFromRlPrice(policyLookup.rlPrice);

  const rangeText = formatPriceRange(policyRange.minPrice, policyRange.maxPrice);
  const isPolicyAligned = Number.isFinite(optimalPrice)
    && optimalPrice >= policyRange.minPrice
    && optimalPrice <= policyRange.maxPrice;
  const isCorrect = isPolicyAligned && wasEncountered;

  let feedbackTone = 'emerald';
  let feedbackTitle = 'Strong match';
  let feedbackBody = `Your answer of $${optimalPrice.toFixed(2)} falls inside the recommended price range of ${rangeText} for this scenario.`;

  if (isPolicyAligned && !wasEncountered) {
    feedbackTone = 'yellow';
    feedbackTitle = 'Good answer, but not from your run';
    feedbackBody = `Your answer of $${optimalPrice.toFixed(2)} falls inside the recommended price range of ${rangeText}, but this exact scenario did not appear in your 21-day run. Since it was not part of your own run, no scenario point is awarded.`;
  } else if (!isPolicyAligned) {
    if (optimalPrice < policyRange.minPrice) {
      feedbackTone = 'amber';
      feedbackTitle = 'A bit too low';
      feedbackBody = `The recommended price range for this scenario is ${rangeText}, so $${optimalPrice.toFixed(2)} is a little too low.`;
    } else {
      feedbackTone = 'rose';
      feedbackTitle = 'A bit too high';
      feedbackBody = `The recommended price range for this scenario is ${rangeText}, so $${optimalPrice.toFixed(2)} is a little too high.`;
    }
  }

  return {
    isCorrect,
    isPolicyAligned,
    wasEncountered,
    rangeText,
    feedbackTone,
    feedbackTitle,
    feedbackBody,
    rlPrice: policyLookup.rlPrice,
  };
};

const PolicyQuizPage = ({
  theme,
  toggleTheme,
  onBackToPolicyReview,
  onRestart,
  onExitToLogin,
  hasRestartedSimulation = false,
  quizState,
  setQuizState,
  history = [],
}) => {
  const {
    answers = {},
    scenarios = [createScenarioCheck(1)],
    submitAttempted = false,
    submitted = false,
  } = quizState;
  const [scenarioPolicyLookups, setScenarioPolicyLookups] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadScenarioPolicies = async () => {
      const entries = await Promise.all(scenarios.map(async (scenario) => {
        const competitorPresent = scenario.competitor === 'present';
        if (competitorPresent && scenario.competitorPrice === '') {
          return [scenario.id, { status: 'incomplete', rlPrice: null }];
        }

        try {
          const suggestion = await PriceSuggestionService.getSuggestions(getScenarioLookupConditions(scenario));
          const rlPrice = Number(suggestion?.rlPrice);

          if (!suggestion || !Number.isFinite(rlPrice)) {
            return [scenario.id, { status: 'missing', rlPrice: null }];
          }

          return [scenario.id, { status: 'ready', rlPrice }];
        } catch (error) {
          console.warn('Failed to load quiz scenario pricing guidance:', error);
          return [scenario.id, { status: 'missing', rlPrice: null }];
        }
      }));

      if (!cancelled) {
        setScenarioPolicyLookups(Object.fromEntries(entries));
      }
    };

    loadScenarioPolicies();

    return () => {
      cancelled = true;
    };
  }, [scenarios]);

  const allAnswered = useMemo(() => {
    const hasMcqAnswers = ALL_QUESTIONS.every((question) => answers[question.id]);
    const hasScenarioAnswers = scenarios.every((scenario) => (
      scenario.optimalPrice !== ''
      && (scenario.competitor === 'absent' || scenario.competitorPrice !== '')
    ));

    return hasMcqAnswers && hasScenarioAnswers;
  }, [answers, scenarios]);

  const mcqScore = useMemo(() => {
    return ALL_QUESTIONS.reduce((total, question) => (
      total + (answers[question.id] === question.correctAnswer ? 1 : 0)
    ), 0);
  }, [answers]);

  const encounteredScenarioKeys = useMemo(() => buildEncounteredScenarioKeys(history), [history]);

  const scenarioResults = useMemo(() => {
    return scenarios.map((scenario) => getScenarioEvaluation(
      scenario,
      encounteredScenarioKeys,
      scenarioPolicyLookups[scenario.id]
    ));
  }, [scenarios, encounteredScenarioKeys, scenarioPolicyLookups]);

  const scenarioScore = useMemo(() => {
    return scenarioResults.reduce((total, result) => total + (result.isCorrect ? 1 : 0), 0);
  }, [scenarioResults]);

  const feedbackClassNames = useMemo(() => (
    theme === 'theme-latte'
      ? {
          emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900',
          amber: 'border-amber-300 bg-amber-50 text-amber-900',
          yellow: 'border-yellow-300 bg-yellow-50 text-yellow-900',
          rose: 'border-rose-300 bg-rose-50 text-rose-900',
        }
      : {
          emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
          amber: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
          yellow: 'border-yellow-300/40 bg-yellow-300/10 text-yellow-100',
          rose: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
        }
  ), [theme]);

  const submittedSummaryClassName = theme === 'theme-latte'
    ? 'relative overflow-hidden rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-100 via-emerald-50 to-amber-50 px-5 py-5 text-sm text-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.10)]'
    : 'relative overflow-hidden rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/16 via-emerald-500/10 to-amber-400/10 px-5 py-5 text-sm text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.16)]';

  const submittedSummaryIconClassName = theme === 'theme-latte'
    ? 'w-8 h-8 text-emerald-600'
    : 'w-8 h-8 text-emerald-300';

  const updateQuizState = useCallback((updater) => {
    setQuizState((previous) => (typeof updater === 'function' ? updater(previous) : updater));
  }, [setQuizState]);

  useEffect(() => {
    updateQuizState((previous) => {
      const normalizedScenarios = previous.scenarios.map((scenario) => {
        const normalizedCompetitorPrice = sanitizeScenarioPriceInput(scenario.competitorPrice);
        const normalizedOptimalPrice = sanitizeScenarioPriceInput(scenario.optimalPrice);

        if (
          normalizedCompetitorPrice === scenario.competitorPrice
          && normalizedOptimalPrice === scenario.optimalPrice
        ) {
          return scenario;
        }

        return {
          ...scenario,
          competitorPrice: normalizedCompetitorPrice,
          optimalPrice: normalizedOptimalPrice,
        };
      });

      const hasChanges = normalizedScenarios.some((scenario, index) => scenario !== previous.scenarios[index]);
      return hasChanges ? { ...previous, scenarios: normalizedScenarios } : previous;
    });
  }, [updateQuizState]);

  const handleAnswerChange = (questionId, value) => {
    if (submitted) return;
    updateQuizState((previous) => ({
      ...previous,
      answers: {
        ...previous.answers,
        [questionId]: value,
      },
    }));
  };

  const handleScenarioChange = (scenarioId, field, value) => {
    if (submitted) return;
    updateQuizState((previous) => ({
      ...previous,
      scenarios: previous.scenarios.map((scenario) => (
        scenario.id === scenarioId
          ? {
              ...scenario,
              [field]: value,
              ...(field === 'competitor' && value === 'absent' ? { competitorPrice: '' } : {}),
            }
          : scenario
      )),
    }));
  };

  const handleScenarioPriceChange = (scenarioId, field, value) => {
    if (value === '') {
      handleScenarioChange(scenarioId, field, '');
      return;
    }

    if (!isWholeDollarInput(value)) {
      return;
    }

    handleScenarioChange(scenarioId, field, value);
  };

  const handleScenarioPriceBlur = (scenarioId, field, value) => {
    if (value === '') return;
    handleScenarioChange(scenarioId, field, sanitizeScenarioPriceInput(value));
  };

  const handleScenarioPriceKeyDown = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (!ALLOWED_SCENARIO_PRICE_KEYS.has(event.key)) {
      event.preventDefault();
    }
  };

  const preventScenarioPriceTextEntry = (event) => {
    event.preventDefault();
  };

  const handleScenarioPriceWheel = (event) => {
    event.preventDefault();
    event.currentTarget.blur();
  };

  const handleAddScenario = () => {
    if (submitted || scenarios.length >= MAX_SCENARIO_CHECKS) return;
    updateQuizState((previous) => ({
      ...previous,
      scenarios: [...previous.scenarios, createScenarioCheck(previous.nextScenarioId)],
      nextScenarioId: previous.nextScenarioId + 1,
    }));
  };

  const handleRemoveScenario = (scenarioId) => {
    if (submitted || scenarios.length === 1) return;
    updateQuizState((previous) => ({
      ...previous,
      scenarios: previous.scenarios.filter((scenario) => scenario.id !== scenarioId),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    updateQuizState((previous) => ({
      ...previous,
      submitAttempted: true,
      submitted: previous.submitted || allAnswered,
    }));
  };

  const handleExportQuizPDF = () => {
    if (!submitted) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - (margin * 2);
    const colors = {
      page: [245, 235, 224],
      panel: [255, 250, 244],
      panelAlt: [255, 246, 232],
      border: [214, 188, 170],
      coffee: [31, 22, 18],
      muted: [101, 79, 67],
      amber: [180, 83, 9],
      yellow: [202, 138, 4],
      emerald: [4, 120, 87],
      rose: [190, 18, 60],
    };
    let y = margin;

    const drawPageBackground = () => {
      pdf.setFillColor(...colors.page);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    const addPage = () => {
      pdf.addPage();
      drawPageBackground();
      y = margin;
    };

    drawPageBackground();

    const ensureSpace = (height) => {
      if (y + height > pageHeight - margin) {
        addPage();
      }
    };

    const addDivider = () => {
      ensureSpace(8);
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
    };

    const addSectionTitle = (title) => {
      ensureSpace(16);
      pdf.setFillColor(...colors.panelAlt);
      pdf.setDrawColor(...colors.border);
      pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.amber);
      pdf.text(title, margin + 4, y + 8);
      y += 18;
    };

    const addScoreCard = (x, title, score, total, accentColor) => {
      const cardWidth = (contentWidth - 8) / 2;
      pdf.setFillColor(...colors.panel);
      pdf.setDrawColor(...accentColor);
      pdf.roundedRect(x, y, cardWidth, 30, 3, 3, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.muted);
      pdf.text(title.toUpperCase(), x + 5, y + 8);
      pdf.setFontSize(22);
      pdf.setTextColor(...accentColor);
      pdf.text(`${score}`, x + 5, y + 22);
      pdf.setFontSize(11);
      pdf.setTextColor(...colors.coffee);
      pdf.text(`/ ${total}`, x + 22, y + 22);
    };

    const addQuestionCard = ({ title, lines, resultColor }) => {
      const splitLines = lines.flatMap(({ label, value }) => {
        const labelText = label ? `${label}: ` : '';
        return pdf.splitTextToSize(`${labelText}${value}`, contentWidth - 12);
      });
      const cardHeight = Math.max(28, 14 + (splitLines.length * 5));

      ensureSpace(cardHeight + 8);
      pdf.setFillColor(...colors.panel);
      pdf.setDrawColor(...colors.border);
      pdf.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'FD');
      pdf.setDrawColor(...resultColor);
      pdf.setLineWidth(1.2);
      pdf.line(margin, y + 3, margin, y + cardHeight - 3);

      let cardY = y + 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(...colors.coffee);
      pdf.text(pdf.splitTextToSize(title, contentWidth - 12), margin + 6, cardY);
      cardY += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.muted);
      lines.forEach(({ label, value, bold = false }) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        const wrapped = pdf.splitTextToSize(`${label ? `${label}: ` : ''}${value}`, contentWidth - 12);
        wrapped.forEach((line) => {
          pdf.text(line, margin + 6, cardY);
          cardY += 5;
        });
      });

      y += cardHeight + 8;
    };

    pdf.setFillColor(...colors.panel);
    pdf.setDrawColor(...colors.border);
    pdf.roundedRect(margin, y, contentWidth, 34, 4, 4, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(19);
    pdf.setTextColor(...colors.coffee);
    pdf.text('Policy Quiz Results', margin + 6, y + 13);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.text('Reinforcement learning concepts, policy reasoning, and scenario checks.', margin + 6, y + 21);
    pdf.text(`Exported: ${new Date().toLocaleString()}`, margin + 6, y + 28);
    y += 42;

    ensureSpace(38);
    addScoreCard(margin, 'Multiple-choice score', mcqScore, ALL_QUESTIONS.length, colors.emerald);
    addScoreCard(margin + ((contentWidth - 8) / 2) + 8, 'Scenario-check score', scenarioScore, scenarios.length, colors.amber);
    y += 38;

    addSectionTitle('Multiple-Choice Questions');
    ALL_QUESTIONS.forEach((question, index) => {
      const selectedValue = answers[question.id];
      const selectedOption = question.options.find((option) => option.value === selectedValue);
      const correctOption = question.options.find((option) => option.value === question.correctAnswer);
      const isCorrect = selectedValue === question.correctAnswer;

      addQuestionCard({
        title: `${index + 1}. ${question.prompt}`,
        resultColor: isCorrect ? colors.emerald : colors.rose,
        lines: [
          { label: 'Your answer', value: selectedOption?.label || 'No answer' },
          { label: 'Correct answer', value: correctOption?.label || 'N/A' },
          { label: 'Result', value: isCorrect ? 'Correct' : 'Not quite', bold: true },
          { label: 'Explanation', value: question.explanation },
        ],
      });
    });

    addDivider();
    addSectionTitle('Scenario Checks');
    scenarios.forEach((scenario, index) => {
      const result = scenarioResults[index];
      const competitorText = scenario.competitor === 'present'
        ? `present at $${Number(scenario.competitorPrice).toFixed(2)}`
        : 'absent';
      const optimalPrice = Number(scenario.optimalPrice);
      const resultColor = {
        emerald: colors.emerald,
        amber: colors.amber,
        yellow: colors.yellow,
        rose: colors.rose,
      }[result.feedbackTone] || colors.amber;

      addQuestionCard({
        title: `Scenario ${index + 1}`,
        resultColor,
        lines: [
          { label: 'Day', value: scenario.day },
          { label: 'Weather', value: scenario.weather },
          { label: 'Traffic', value: scenario.traffic },
          { label: 'Competitor', value: competitorText },
          { label: 'Your optimal price', value: Number.isFinite(optimalPrice) ? `$${optimalPrice.toFixed(2)}` : 'N/A' },
          { label: 'Recommended range', value: result.rangeText },
          { label: 'Result', value: result.isCorrect ? 'Strong match from your run' : result.feedbackTitle, bold: true },
          { label: 'Feedback', value: result.feedbackBody },
        ],
      });
    });

    pdf.save('policy_quiz_results.pdf');
  };

  const renderQuestionBlock = (question, displayIndex) => {
    const isCorrect = answers[question.id] === question.correctAnswer;

    return (
      <div key={question.id} className="bg-coffee-950/60 border border-coffee-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-coffee-100 mb-3">
          {displayIndex}. {question.prompt}
        </p>
        <div className="space-y-2" role="radiogroup" aria-label={question.prompt}>
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option.value;

            return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={submitted}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleAnswerChange(question.id, option.value)}
              className={`flex w-full items-start gap-3 rounded-lg px-2 py-1 text-left text-sm transition-colors ${
                submitted
                  ? 'cursor-default text-coffee-300'
                  : 'cursor-pointer text-coffee-200 hover:bg-coffee-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60'
              }`}
            >
              <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isSelected
                  ? 'border-amber-400 bg-amber-400'
                  : submitted
                    ? 'border-coffee-600 bg-coffee-900/70'
                    : 'border-coffee-500 bg-coffee-950'
              }`}>
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-coffee-950" />}
              </span>
              <span>{option.label}</span>
            </button>
            );
          })}
        </div>

        {submitted && (
          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${isCorrect ? feedbackClassNames.emerald : feedbackClassNames.rose}`}>
            <div className="flex items-start gap-3">
              {isCorrect ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
              <div>
                <p className="font-semibold">{isCorrect ? 'Correct' : 'Not quite'}</p>
                <p>{question.explanation}</p>
                {!isCorrect && (
                  <p className="mt-1">
                    Correct answer: <span className="font-semibold">{question.options.find((option) => option.value === question.correctAnswer)?.label}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full w-full bg-coffee-950 text-coffee-100 p-4 md:p-8 flex flex-col items-center animate-in fade-in duration-500 overflow-x-hidden overflow-y-auto ${theme}`}>
      <form onSubmit={handleSubmit} className="w-full max-w-5xl min-w-0 bg-coffee-900 p-6 md:p-8 rounded-2xl border border-coffee-700 shadow-2xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-amber-400" />
            <div>
              <h2 className="text-3xl font-bold text-coffee-100">Policy Quiz</h2>
              <p className="text-sm text-coffee-400 mt-1">Test whether the policy patterns and RL terminology really clicked.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="shrink-0 p-2 bg-coffee-800/50 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700/50 transition-all text-coffee-200"
          >
            {theme === 'theme-latte' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <div className="w-full min-w-0 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-coffee-400 mb-3">RL Terminology Questions</p>
            <div className="space-y-4">
              {TERMINOLOGY_QUESTIONS.map((question, index) => renderQuestionBlock(question, index + 1))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-coffee-400 mb-3">Simulation Questions</p>
            <div className="space-y-4">
              {POLICY_QUESTIONS.map((question, index) => renderQuestionBlock(question, TERMINOLOGY_QUESTIONS.length + index + 1))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-coffee-400">Policy Question</p>
                <p className="text-sm text-coffee-400 mt-1">Add up to {MAX_SCENARIO_CHECKS} scenario checks and compare your chosen price against the recommended pricing range for each situation.</p>
              </div>
              {!submitted && (
                <button
                  type="button"
                  onClick={handleAddScenario}
                  disabled={scenarios.length >= MAX_SCENARIO_CHECKS}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-coffee-100 border border-coffee-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add another scenario
                </button>
              )}
            </div>

            <div className="space-y-4">
              {scenarios.map((scenario, index) => {
                const scenarioResult = scenarioResults[index];

                return (
                  <div key={scenario.id} className="min-w-0 bg-coffee-950/60 border border-coffee-700 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-coffee-100">Scenario Check {index + 1}</p>
                      {!submitted && scenarios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveScenario(scenario.id)}
                          className="inline-flex items-center gap-2 text-xs text-rose-300 hover:text-rose-200"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <select
                        value={scenario.day}
                        onChange={(e) => handleScenarioChange(scenario.id, 'day', e.target.value)}
                        disabled={submitted}
                        className="bg-coffee-950 border border-coffee-700 rounded-lg px-3 py-2 text-sm text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      >
                        {WEEK_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                      </select>
                      <select
                        value={scenario.weather}
                        onChange={(e) => handleScenarioChange(scenario.id, 'weather', e.target.value)}
                        disabled={submitted}
                        className="bg-coffee-950 border border-coffee-700 rounded-lg px-3 py-2 text-sm text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      >
                        {WEATHER_OPTIONS.map((weather) => <option key={weather} value={weather}>{weather}</option>)}
                      </select>
                      <select
                        value={scenario.traffic}
                        onChange={(e) => handleScenarioChange(scenario.id, 'traffic', e.target.value)}
                        disabled={submitted}
                        className="bg-coffee-950 border border-coffee-700 rounded-lg px-3 py-2 text-sm text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      >
                        {TRAFFIC_OPTIONS.map((traffic) => <option key={traffic} value={traffic}>{traffic}</option>)}
                      </select>
                      <select
                        value={scenario.competitor}
                        onChange={(e) => handleScenarioChange(scenario.id, 'competitor', e.target.value)}
                        disabled={submitted}
                        className="bg-coffee-950 border border-coffee-700 rounded-lg px-3 py-2 text-sm text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      >
                        <option value="absent">competitor absent</option>
                        <option value="present">competitor present</option>
                      </select>
                    </div>

                    <div className="min-w-0 break-words bg-coffee-900/60 border border-coffee-700 rounded-lg p-4 text-sm text-coffee-100 leading-relaxed">
                      For a <span className="text-amber-400 font-bold">{scenario.day}</span>, when the weather is <span className="text-amber-400 font-bold">{scenario.weather}</span>, the market traffic is <span className="text-amber-400 font-bold">{scenario.traffic}</span> and the competitor is{' '}
                      {scenario.competitor === 'present' ? (
                        <>
                          <span className="text-red-400 font-bold">present</span> with a price of $
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="10"
                            inputMode="none"
                            value={scenario.competitorPrice}
                            onChange={(e) => handleScenarioPriceChange(scenario.id, 'competitorPrice', e.target.value)}
                            onBlur={(e) => handleScenarioPriceBlur(scenario.id, 'competitorPrice', e.target.value)}
                            onKeyDown={handleScenarioPriceKeyDown}
                            onPaste={preventScenarioPriceTextEntry}
                            onDrop={preventScenarioPriceTextEntry}
                            onWheel={handleScenarioPriceWheel}
                            disabled={submitted}
                            placeholder="__"
                            className="mx-1 inline-block w-20 bg-coffee-950 border border-coffee-700 rounded px-2 py-1 text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                          />
                          : the optimal price of coffee for that day is $
                        </>
                      ) : (
                        <>
                          <span className="text-emerald-400 font-bold">absent</span>: the optimal price of coffee for that day is $
                        </>
                      )}
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="10"
                        inputMode="none"
                        value={scenario.optimalPrice}
                        onChange={(e) => handleScenarioPriceChange(scenario.id, 'optimalPrice', e.target.value)}
                        onBlur={(e) => handleScenarioPriceBlur(scenario.id, 'optimalPrice', e.target.value)}
                        onKeyDown={handleScenarioPriceKeyDown}
                        onPaste={preventScenarioPriceTextEntry}
                        onDrop={preventScenarioPriceTextEntry}
                        onWheel={handleScenarioPriceWheel}
                        disabled={submitted}
                        placeholder="__"
                        className="mx-1 inline-block w-20 bg-coffee-950 border border-coffee-700 rounded px-2 py-1 text-coffee-100 focus:outline-none focus:border-amber-500 disabled:opacity-70"
                      />
                    </div>

                    {submitted && (
                      <div className={`rounded-lg border px-4 py-3 text-sm ${feedbackClassNames[scenarioResult.feedbackTone]}`}>
                        <div className="flex items-start gap-3">
                          {scenarioResult.isPolicyAligned ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
                          <div>
                            <p className="font-semibold">{scenarioResult.feedbackTitle}</p>
                            <p>{scenarioResult.feedbackBody}</p>
                            <p className="mt-1">Recommended price range for this state: <span className="font-semibold">{scenarioResult.rangeText}</span></p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {!submitted && (
            <button
              type="submit"
              className="self-start px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-coffee-950 font-semibold transition-colors shadow-lg shadow-amber-900/20"
            >
              Submit Quiz
            </button>
          )}

          {submitAttempted && !allAnswered && !submitted && (
            <p className="text-sm text-rose-300">
              Please answer all multiple-choice questions and fill in every scenario check before submitting.
            </p>
          )}

          {submitted && (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={submittedSummaryClassName}
              >
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-24 w-24 bg-gradient-to-r from-transparent via-white/18 to-transparent"
                  animate={{ x: [0, 520] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.1, ease: 'easeInOut' }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute left-4 top-3 h-2.5 w-2.5 rounded-full bg-emerald-300/80"
                  animate={{ y: [0, -8, 0], opacity: [0.55, 1, 0.55], scale: [1, 1.25, 1] }}
                  transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute right-8 top-4 h-2 w-2 rounded-full bg-amber-300/80"
                  animate={{ y: [0, -10, 0], opacity: [0.45, 0.95, 0.45], scale: [1, 1.35, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute left-1/3 top-2 h-2.5 w-2.5 rotate-45 bg-yellow-300/80"
                  animate={{ y: [0, -12, 0], rotate: [45, 90, 45], opacity: [0.4, 1, 0.4], scale: [0.9, 1.3, 0.9] }}
                  transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute right-1/4 top-2 h-2 w-2 rounded-full bg-pink-300/75"
                  animate={{ y: [0, -9, 0], x: [0, 3, 0], opacity: [0.35, 0.95, 0.35], scale: [0.85, 1.25, 0.85] }}
                  transition={{ duration: 1.95, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute right-16 bottom-3 h-3 w-3 rounded-full border border-emerald-200/70"
                  animate={{ y: [0, 6, 0], opacity: [0.35, 0.8, 0.35], scale: [0.9, 1.15, 0.9] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute left-1/4 bottom-3 h-2.5 w-2.5 rounded-full bg-amber-300/80"
                  animate={{ y: [0, 8, 0], opacity: [0.35, 0.9, 0.35], scale: [0.85, 1.2, 0.85] }}
                  transition={{ duration: 2.15, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute right-10 top-1/2 h-2.5 w-2.5 rounded-full bg-emerald-200/80"
                  animate={{ x: [0, 5, 0], y: [0, -6, 0], opacity: [0.3, 0.85, 0.3], scale: [0.9, 1.25, 0.9] }}
                  transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute left-10 bottom-2 h-8 w-8 rounded-full bg-emerald-300/10 blur-xl"
                  animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="mb-3"
                  >
                    <CheckCircle2 className={submittedSummaryIconClassName} />
                  </motion.div>
                  <p className="text-2xl font-black leading-tight md:text-3xl">Quiz submitted. Nice work!</p>
                  <p className="mt-2 text-sm font-medium md:text-base">Thank you for taking the time to finish the quiz.</p>

                  <div className="mt-5 grid w-full gap-3 md:grid-cols-2">
                    <div className={`rounded-lg border px-4 py-4 text-center shadow-lg ${
                      theme === 'theme-latte'
                        ? 'border-emerald-300 bg-white/75 text-emerald-950'
                        : 'border-emerald-400/35 bg-coffee-950/45 text-emerald-100'
                    }`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">Multiple Choice</p>
                      <p className="mt-2 text-4xl font-black leading-none">{mcqScore}<span className="text-lg opacity-70">/{ALL_QUESTIONS.length}</span></p>
                      <p className="mt-2 text-xs font-semibold opacity-85">questions correct</p>
                    </div>

                    <div className={`rounded-lg border px-4 py-4 text-center shadow-lg ${
                      theme === 'theme-latte'
                        ? 'border-amber-300 bg-white/75 text-amber-950'
                        : 'border-amber-400/35 bg-coffee-950/45 text-amber-100'
                    }`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">Scenario Checks</p>
                      <p className="mt-2 text-4xl font-black leading-none">{scenarioScore}<span className="text-lg opacity-70">/{scenarios.length}</span></p>
                      <p className="mt-2 text-xs font-semibold opacity-85">earned scenario points</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <motion.button
              type="button"
              whileHover={{ scale: submitted ? 1 : 1.05, x: submitted ? 0 : -5 }}
              whileTap={{ scale: submitted ? 1 : 0.95 }}
              onClick={onBackToPolicyReview}
              className="inline-flex items-center gap-2 text-coffee-300 hover:text-coffee-100 transition-colors bg-coffee-800/50 hover:bg-coffee-700/50 px-4 py-2 rounded-lg border border-coffee-700/50 self-start"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Policy Review
            </motion.button>

            <div className={`flex flex-col gap-3 md:flex-row md:items-center ${submitted ? '' : 'md:ml-auto'}`}>
              {submitted && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportQuizPDF}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-lg shadow-blue-900/20"
                >
                  <Download className="w-4 h-4" />
                  Download Quiz Results
                </motion.button>
              )}

              {!hasRestartedSimulation && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRestart}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-lg shadow-emerald-900/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  Run Simulation Again
                </motion.button>
              )}

              <button
                type="button"
                onClick={onExitToLogin}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-lg shadow-red-900/20 md:self-end"
              >
                <LogOut className="w-4 h-4" />
                Exit the Session
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PolicyQuizPage;
