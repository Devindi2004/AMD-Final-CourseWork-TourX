// Every schema uses a custom String _id (see idGenerator.js) instead of ObjectId, and
// this plugin renames _id -> id in JSON output so API responses are shaped exactly
// like the previous json-server-backed API (which the frontend already expects).
function idTransform(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  });
}

module.exports = { idTransform };
