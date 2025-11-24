const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
const API_KEY = process.env.GEMINI_API_KEY;
const MAX_TOKENS = 4096;

const formatCards = cards => (Array.isArray(cards) && cards.length ? cards.join(' ') : 'n/a');

const describeEmptyResponse = response => {
  const candidate = response?.response?.candidates?.[0];
  if (!candidate) {
    return 'No candidates returned.';
  }

  const finishReason = candidate.finishReason || 'unspecified';
  const safety =
    candidate.safetyRatings?.map(rating => `${rating.category}:${rating.probability}`).join(', ') ||
    'none';
  return `Finish reason: ${finishReason}. Safety: ${safety}`;
};

const buildPrompt = ({ hero, board, equityPercentage, potOddsRatio, gtoSummary }) => {
  const heroText = formatCards(hero);
  const boardText = formatCards(board);
  const equityText = typeof equityPercentage === 'number' ? equityPercentage.toFixed(1) : 'n/a';

  const primaryGto = gtoSummary?.recommendation?.label || 'No solver line available';
  const secondary =
    gtoSummary?.topActions
      ?.map(action => {
        const percent =
          typeof action.probability === 'number'
            ? `${(action.probability * 100).toFixed(0)}%`
            : null;
        return percent ? `${action.label} (${percent})` : action.label;
      })
      .join(', ') || '';

  const availabilityNote =
    gtoSummary?.status && gtoSummary.status !== 'ok'
      ? `Solver note: ${gtoSummary.message || gtoSummary.status}.`
      : '';

  return [
    'You are a poker coach. Explain the recommended play concisely.',
    `Hero hand: ${heroText}. Board: ${boardText}.`,
    `Equity: ${equityText}%. Pot odds ratio needed to continue: ${potOddsRatio}.`,
    `GTO prefers: ${primaryGto}${secondary ? ` | Other lines: ${secondary}` : ''}.`,
    availabilityNote,
    'Give 2-3 sentences: explain the recommended play based off of the hand, board, equity, pot odds, and GTO solver output.',
    'Assume the player knows the basics of poker and they want to understand the play to improve their skills.',
    'Avoid too much technical jargon; use simple language.',
    'Keep it under 80 words.'
  ]
    .filter(Boolean)
    .join('\n');
};

const buildFallbackExplanation = ({ equityPercentage, potOddsRatio, gtoSummary }) => {
  const equity = Number.isFinite(equityPercentage) ? equityPercentage.toFixed(1) : 'unknown';
  const primary = gtoSummary?.recommendation?.label || 'No solver line available';
  return (
    `With ~${equity}% equity and pot odds of ${potOddsRatio}, the solver leans toward ${primary}. ` +
    'Stick with that line when your equity beats the breakeven odds; tighten up on wetter boards or when your equity drops. ' +
    'If the board gets scarier, favor more checks/folds; on safe runouts, keep the pressure.'
  );
};

const extractText = response => {
  const direct = response?.response?.text?.();
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  const candidate = response?.response?.candidates?.[0]?.content?.parts
    ?.map(part => part?.text || '')
    .join('')
    .trim();
  return candidate || null;
};

exports.getPlayExplanation = async context => {
  if (!API_KEY) {
    console.warn('Gemini is disabled: GEMINI_API_KEY is missing.');
    return null;
  }

  try {
    const client = new GoogleGenerativeAI(API_KEY);
    const model = client.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildPrompt(context);
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: MAX_TOKENS }
    });

    const text = extractText(response);
    if (text) {
      return text;
    }

    console.warn(
      `Gemini returned an empty response for model "${MODEL_NAME}". ${describeEmptyResponse(response)}`
    );
    return buildFallbackExplanation(context);
  } catch (error) {
    console.error(`Gemini explanation failed for model "${MODEL_NAME}":`, error);
  }

  return buildFallbackExplanation(context);
};
