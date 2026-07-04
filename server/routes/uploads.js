const express = require('express');
const cloudinary = require('cloudinary').v2;
const { requireAuth } = require('../middleware/auth');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

const isConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);
if (isConfigured) {
  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
}

module.exports = function createUploadsRouter() {
  const router = express.Router();

  // Signed-upload pattern: the API secret never leaves the server. The client
  // uploads the file directly to Cloudinary using this short-lived signature,
  // so image bytes never round-trip through our own server.
  router.post('/signature', requireAuth, (req, res) => {
    if (!isConfigured) {
      return res.status(501).json({
        message: 'Cloudinary is not configured on this server yet. Set CLOUDINARY_* vars in server/.env (see README).',
        code: 'CLOUDINARY_NOT_CONFIGURED',
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `tourx/avatars/${req.user.sub}`;
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, API_SECRET);

    res.json({
      timestamp,
      folder,
      signature,
      apiKey: API_KEY,
      cloudName: CLOUD_NAME,
      uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    });
  });

  return router;
};
