/**
 * Text Utilities
 * Handles text normalization and string transformations
 */

/**
 * Normalize text by removing Vietnamese diacritics
 * and converting to lowercase
 * @param {string} value - Text to normalize
 * @returns {string} Normalized text
 */
const normalizeText = (value = '') => {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

/**
 * Check if text contains keyword (case-insensitive, accent-insensitive)
 * @param {string} text - Text to search in
 * @param {string} keyword - Keyword to search for
 * @returns {boolean} True if keyword is found
 */
const containsKeyword = (text, keyword) => {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  return normalizedText.includes(normalizedKeyword);
};

/**
 * Find matching keywords from a list
 * @param {string} text - Text to search in
 * @param {string[]} keywords - List of keywords
 * @returns {string|null} First matching keyword or null
 */
const findMatchingKeyword = (text, keywords = []) => {
  return keywords.find((keyword) => containsKeyword(text, keyword)) || null;
};

module.exports = {
  normalizeText,
  containsKeyword,
  findMatchingKeyword
};
