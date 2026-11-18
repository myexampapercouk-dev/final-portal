// A teacher's subject remark must be a proper piece of feedback: at least 35 words.
const MIN_REMARK_WORDS = 35;
const countWords = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).length;
const remarkTooShort = (text) => countWords(text) < MIN_REMARK_WORDS;
const remarkError = (text) => `Each remark needs at least ${MIN_REMARK_WORDS} words (this one has ${countWords(text)}).`;

module.exports = { MIN_REMARK_WORDS, countWords, remarkTooShort, remarkError };
