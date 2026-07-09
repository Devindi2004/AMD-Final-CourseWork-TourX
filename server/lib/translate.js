const { client, isAnthropicConfigured } = require('./anthropicClient');

const MODEL = 'claude-haiku-4-5';

const TRANSLATE_TOOL = {
  name: 'submit_translation',
  description: 'Submit the detected source language and the translated text.',
  input_schema: {
    type: 'object',
    properties: {
      detectedSourceLang: {
        type: 'string',
        description: 'ISO 639-1 (or 639-2 if no 639-1 exists) code of the detected source language, e.g. "fr", "si", "zh".',
      },
      detectedSourceLangName: {
        type: 'string',
        description: 'Full English name of the detected source language, e.g. "French", "Sinhala", "Chinese".',
      },
      translated: {
        type: 'string',
        description: 'The text translated into the requested target language. Preserve tone and meaning; do not add commentary.',
      },
    },
    required: ['detectedSourceLang', 'detectedSourceLangName', 'translated'],
  },
};

/**
 * Detects the source language of `text` and translates it into `targetLanguage`
 * (a plain English language name, e.g. "Japanese") using Claude. Supports any
 * language Claude recognises — effectively 100+ — with no hardcoded phrasebook.
 */
async function translateText(text, targetLanguage) {
  if (!isAnthropicConfigured()) {
    const err = new Error('AI Translator is not configured on this server yet. Set ANTHROPIC_API_KEY in server/.env (see README).');
    err.code = 'ANTHROPIC_NOT_CONFIGURED';
    throw err;
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [TRANSLATE_TOOL],
    tool_choice: { type: 'tool', name: 'submit_translation' },
    messages: [
      {
        role: 'user',
        content: `Detect the language of the following text, then translate it into ${targetLanguage}. Keep the translation natural and idiomatic, not word-for-word literal.\n\nText:\n"""${text}"""`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    const err = new Error('The translation model did not return a structured result.');
    err.code = 'TRANSLATION_FAILED';
    throw err;
  }

  return toolUse.input;
}

module.exports = { translateText };
