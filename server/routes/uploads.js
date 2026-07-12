const express = require('express');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { requireAuth } = require('../middleware/auth');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

const isConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);
if (isConfigured) {
  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
}

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
const MAX_LOCAL_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB decoded, comfortably under the 5MB JSON body limit

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

  // Fallback for local dev when Cloudinary hasn't been configured: saves the image
  // straight to disk and serves it back from this same server via /uploads/avatars/...
  // so profile pictures still work out of the box with zero third-party setup.
  router.post('/local', requireAuth, (req, res) => {
    const { imageBase64 } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ message: 'imageBase64 is required' });
    }

    const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(imageBase64);
    const ext = match ? (match[1] === 'jpeg' ? 'jpg' : match[1]) : 'jpg';
    const base64Data = match ? match[2] : imageBase64;
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > MAX_LOCAL_UPLOAD_BYTES) {
      return res.status(413).json({ message: 'Image is too large. Please use a smaller photo.' });
    }

    const userDir = path.join(UPLOADS_DIR, req.user.sub);
    fs.mkdirSync(userDir, { recursive: true });
    const filename = `${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(userDir, filename), buffer);

    const origin = `${req.protocol}://${req.get('host')}`;
    res.json({ url: `${origin}/uploads/avatars/${req.user.sub}/${filename}` });
  });

  return router;
};
