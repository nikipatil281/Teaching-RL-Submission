import { PriceSuggestionRepository } from '../../infrastructure/models/PriceSuggestionRepository';

/**
 * PriceSuggestionService handles the parsing and lookup logic for price suggestions.
 */
export class PriceSuggestionService {
  /** @private */
  static suggestionTablePromise = null;
  /** @private */
  static repository = new PriceSuggestionRepository();

  /**
   * Initializes the suggestion table.
   */
  static async init() {
    try {
      if (!this.suggestionTablePromise) {
        this.suggestionTablePromise = this.loadSuggestionTable();
      }
      await this.suggestionTablePromise;
      return true;
    } catch (error) {
      console.warn('Price suggestion service failed to initialize:', error);
      return false;
    }
  }

  /**
   * Gets price suggestions for the given conditions.
   * @param {Object} conditions 
   */
  static async getSuggestions(conditions) {
    if (!this.suggestionTablePromise) {
      await this.init();
    }

    const table = await this.suggestionTablePromise;
    const key = this.buildLookupKey(conditions);
    const row = table.get(key);

    if (!row) return null;

    return {
      mlPrice: Number(row.ml_suggested_price),
      rlPrice: Number(row.rl_suggested_price),
      row
    };
  }

  /** @private */
  static async loadSuggestionTable() {
    const csvContent = await this.repository.fetchCsv();
    const rows = this.parseCsv(csvContent);
    const byState = new Map();

    for (const row of rows) {
      const key = this.buildLookupKey({
        day: row.day,
        weather: row.weather,
        competitorPresent: row.competitor === 'present',
        competitorPrice: row.competitor_price,
        nearbyEvent: row.local_event === 'yes'
      });
      byState.set(key, row);
    }

    return byState;
  }

  /** @private */
  static parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    
    const headerLine = lines[0];
    const dataLines = lines.slice(1);
    const headers = this.parseCsvLine(headerLine);

    return dataLines
      .filter(Boolean)
      .map((line) => {
        const values = this.parseCsvLine(line);
        return headers.reduce((row, header, index) => ({
          ...row,
          [header]: values[index] ?? ''
        }), {});
      });
  }

  /** @private */
  static parseCsvLine(line) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const nextChar = line[index + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current);
    return cells;
  }

  /** @private */
  static buildLookupKey({ day, weather, competitorPresent, competitorPrice, nearbyEvent }) {
    const normalizeText = (v) => String(v ?? '').trim();
    const normalizeBooleanLabel = (v) => (v ? 'yes' : 'no');
    const normalizeCompetitorLabel = (v) => (v ? 'present' : 'absent');
    const normalizePriceKey = (v) => {
      const numeric = Number(v);
      return Number.isFinite(numeric) ? String(Math.round(numeric)) : '';
    };

    return [
      normalizeText(day),
      normalizeText(weather),
      normalizeCompetitorLabel(competitorPresent),
      competitorPresent ? normalizePriceKey(competitorPrice) : '',
      normalizeBooleanLabel(nearbyEvent)
    ].join('|');
  }
}
