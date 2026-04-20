/**
 * PriceSuggestionRepository handles fetching the price suggestion data from external sources.
 */
export class PriceSuggestionRepository {
  static CSV_PATH = `${import.meta.env.BASE_URL}valid_state_price_suggestions.csv`;

  /**
   * Fetches the CSV content.
   * @returns {Promise<string>}
   */
  async fetchCsv() {
    const response = await fetch(PriceSuggestionRepository.CSV_PATH);
    if (!response.ok) {
      throw new Error(`Unable to load price suggestion CSV: ${response.status}`);
    }
    return response.text();
  }
}
