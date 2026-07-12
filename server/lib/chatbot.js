const ollama = require('ollama').default;

const MODEL = 'gemma3:4b';

const SYSTEM_PROMPT = `You are TourX AI, an intelligent tourism assistant for Sri Lanka.

Help users with:
- Trip Planning
- Hotels
- Restaurants
- Tourist Attractions
- Weather
- Budget
- Transportation

Keep replies conversational and concise (a few sentences) unless the user asks for more detail.
Always answer in the same language used by the user.`;

/**
 * Sends `message` to a local Ollama model along with prior conversation
 * `history` (an array of { role: 'user' | 'assistant', text: string },
 * oldest first) and returns the assistant's reply text.
 */
async function askChatbot(message, history = []) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((turn) => ({ role: turn.role, content: turn.text })),
    { role: 'user', content: message },
  ];

  let response;
  try {
    response = await ollama.chat({ model: MODEL, messages });
  } catch (cause) {
    const err = new Error(
      `Could not reach the local Ollama model "${MODEL}". Make sure Ollama is running (ollama serve) and the model is pulled (ollama pull ${MODEL}).`
    );
    err.code = 'OLLAMA_UNAVAILABLE';
    err.cause = cause;
    throw err;
  }

  return response.message.content;
}

module.exports = { askChatbot };
