const { client, isAnthropicConfigured } = require('./anthropicClient');

const MODEL = 'claude-haiku-4-5';

const INSIGHTS_TOOL = {
  name: 'submit_destination_insights',
  description: 'Submit structured travel insights for a Sri Lankan destination photo.',
  input_schema: {
    type: 'object',
    properties: {
      travelSummary: { type: 'string', description: 'A 2-3 sentence overview of the destination.' },
      history: { type: 'string', description: 'Brief historical or cultural background.' },
      bestTimeToVisit: { type: 'string', description: 'Best months/season to visit and why.' },
      weather: { type: 'string', description: 'Typical weather to expect.' },
      thingsToDo: { type: 'array', items: { type: 'string' }, description: '3-5 short activity suggestions.' },
      nearbyAttractions: { type: 'array', items: { type: 'string' }, description: '2-4 nearby attractions by name.' },
      nearbyHotels: { type: 'array', items: { type: 'string' }, description: '2-3 nearby hotel/stay suggestions by name or type.' },
      nearbyRestaurants: { type: 'array', items: { type: 'string' }, description: '2-3 nearby food suggestions by name or type.' },
      travelTips: { type: 'array', items: { type: 'string' }, description: '2-4 practical travel tips.' },
      estimatedBudgetUsd: { type: 'string', description: 'A rough per-person daily budget range in USD, e.g. "$15-30/day".' },
    },
    required: [
      'travelSummary', 'history', 'bestTimeToVisit', 'weather', 'thingsToDo',
      'nearbyAttractions', 'nearbyHotels', 'nearbyRestaurants', 'travelTips', 'estimatedBudgetUsd',
    ],
  },
};

/**
 * Generates structured destination insights for a gallery item using its
 * metadata (title/category/district/province/description/tags) — Claude's
 * own Sri Lanka knowledge fills in the rest, same graceful-degradation
 * pattern as translateText/askChatbot when ANTHROPIC_API_KEY is unset.
 */
async function generateGalleryInsights(item) {
  if (!isAnthropicConfigured()) {
    const err = new Error('AI insights are not configured on this server yet. Set ANTHROPIC_API_KEY in server/.env (see README).');
    err.code = 'ANTHROPIC_NOT_CONFIGURED';
    throw err;
  }

  const context = [
    `Destination: ${item.title}`,
    `Category: ${item.category}`,
    `Location: ${item.district} District, ${item.province} Province, Sri Lanka`,
    item.description ? `Description: ${item.description}` : null,
    item.tags?.length ? `Tags: ${item.tags.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [INSIGHTS_TOOL],
    tool_choice: { type: 'tool', name: 'submit_destination_insights' },
    messages: [
      {
        role: 'user',
        content: `Generate travel insights for this Sri Lankan destination for a tourism app:\n\n${context}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    const err = new Error('The AI did not return structured insights.');
    err.code = 'AI_INSIGHTS_FAILED';
    throw err;
  }

  return toolUse.input;
}

module.exports = { generateGalleryInsights };
