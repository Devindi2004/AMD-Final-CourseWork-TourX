const crypto = require('crypto');

/** Short, human-scannable ids (e.g. "trip-8f2a1c9b4d3e") instead of raw ObjectIds. */
function makeIdFactory(prefix) {
  return () => `${prefix}-${crypto.randomBytes(6).toString('hex')}`;
}

module.exports = { makeIdFactory };
