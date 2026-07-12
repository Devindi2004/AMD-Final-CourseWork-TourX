const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../lib/validation');
const { galleryCreateSchema, galleryUpdateSchema, galleryCommentSchema, GALLERY_SORTS } = require('../lib/gallerySchemas');
const { makeIdFactory } = require('../lib/idGenerator');
const { generateGalleryInsights } = require('../lib/galleryAi');

const newGalleryId = makeIdFactory('gal');
const newCommentId = makeIdFactory('gcm');

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down.' },
});

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Cloudinary URL manipulation: insert an f_auto,q_auto transformation segment
// right after "/upload/" so delivery is auto-compressed/format-optimized with
// no extra API calls. No-op for non-Cloudinary (local-fallback) URLs.
function withTransform(url, transform) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transform}/`);
}

function toPublicItem(item) {
  return {
    ...item,
    thumbnailUrl: withTransform(item.imageUrl, 'c_fill,w_480,h_640,f_auto,q_auto'),
    displayUrl: withTransform(item.imageUrl, 'f_auto,q_auto'),
    likesCount: item.likedBy?.length || 0,
  };
}

module.exports = function createGalleryRouter(db) {
  const router = express.Router();

  function collection() {
    return db.get('gallery');
  }

  function approvedQuery() {
    return collection().filter((g) => g.status === 'approved');
  }

  function applyFilters(items, query) {
    const { category, district, province, q, tags, minRating, entryFee, familyFriendly } = query;
    let result = items;
    if (category) result = result.filter((g) => g.category.toLowerCase() === String(category).toLowerCase());
    if (district) result = result.filter((g) => g.district.toLowerCase() === String(district).toLowerCase());
    if (province) result = result.filter((g) => g.province.toLowerCase() === String(province).toLowerCase());
    if (entryFee) result = result.filter((g) => g.entryFee === entryFee);
    if (familyFriendly !== undefined) result = result.filter((g) => g.familyFriendly === (familyFriendly === 'true'));
    if (minRating) result = result.filter((g) => g.rating >= Number(minRating));
    if (tags) {
      const wanted = String(tags).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      result = result.filter((g) => wanted.every((t) => (g.tags || []).some((tag) => tag.toLowerCase() === t)));
    }
    if (q) {
      const needle = String(q).toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(needle) ||
          g.district.toLowerCase().includes(needle) ||
          g.province.toLowerCase().includes(needle) ||
          g.category.toLowerCase().includes(needle) ||
          (g.tags || []).some((tag) => tag.toLowerCase().includes(needle))
      );
    }
    return result;
  }

  function applySort(items, sort) {
    switch (sort) {
      case 'oldest':
        return [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'popular':
        return [...items].sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0));
      case 'trending':
        return [...items].sort((a, b) => b.views - a.views);
      case 'newest':
      default:
        return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  function listResponse(req, res, { forcedSort } = {}) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const sort = forcedSort || (GALLERY_SORTS.includes(req.query.sort) ? req.query.sort : 'newest');

    const filtered = applyFilters(approvedQuery().value(), req.query);
    const sorted = applySort(filtered, sort);
    const start = (page - 1) * limit;
    const pageItems = sorted.slice(start, start + limit);

    res.json({
      items: pageItems.map(toPublicItem),
      page,
      limit,
      total: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / limit)),
    });
  }

  router.get('/', (req, res) => listResponse(req, res));
  router.get('/trending', (req, res) => listResponse(req, res, { forcedSort: 'trending' }));
  router.get('/popular', (req, res) => listResponse(req, res, { forcedSort: 'popular' }));
  router.get('/recent', (req, res) => listResponse(req, res, { forcedSort: 'newest' }));
  router.get('/search', (req, res) => listResponse(req, res));
  router.get('/category/:category', (req, res) => listResponse(req, res));

  router.get('/:id/nearby', (req, res) => {
    const item = collection().find({ id: req.params.id }).value();
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    if (item.lat == null || item.lng == null) return res.json([]);

    const others = approvedQuery()
      .value()
      .filter((g) => g.id !== item.id && g.lat != null && g.lng != null)
      .map((g) => {
        const distanceKm = Number(haversineKm(item, g).toFixed(1));
        return { ...toPublicItem(g), distanceKm, estimatedMinutes: Math.round((distanceKm / 40) * 60) };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6);

    res.json(others);
  });

  router.get('/:id', (req, res) => {
    const item = collection().find({ id: req.params.id }).value();
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    collection().find({ id: req.params.id }).assign({ views: (item.views || 0) + 1 }).write();
    res.json(toPublicItem(collection().find({ id: req.params.id }).value()));
  });

  router.post('/', writeLimiter, requireAuth, validate(galleryCreateSchema), (req, res) => {
    const now = new Date().toISOString();
    const item = {
      id: newGalleryId(),
      ...req.body,
      rating: 0,
      views: 0,
      downloads: 0,
      likedBy: [],
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      aiDescription: null,
      createdBy: req.user.sub,
      createdAt: now,
      updatedAt: now,
    };
    collection().push(item).write();
    res.status(201).json(toPublicItem(item));
  });

  function ownerOrAdmin(req, res, item) {
    if (!item) {
      res.status(404).json({ message: 'Gallery item not found' });
      return false;
    }
    if (item.createdBy !== req.user.sub && req.user.role !== 'admin') {
      res.status(403).json({ message: 'You can only modify your own uploads.' });
      return false;
    }
    return true;
  }

  router.put('/:id', writeLimiter, requireAuth, validate(galleryUpdateSchema), (req, res) => {
    const item = collection().find({ id: req.params.id }).value();
    if (!ownerOrAdmin(req, res, item)) return;
    collection().find({ id: req.params.id }).assign({ ...req.body, updatedAt: new Date().toISOString() }).write();
    res.json(toPublicItem(collection().find({ id: req.params.id }).value()));
  });

  router.delete('/:id', writeLimiter, requireAuth, (req, res) => {
    const item = collection().find({ id: req.params.id }).value();
    if (!ownerOrAdmin(req, res, item)) return;
    collection().remove({ id: req.params.id }).write();
    db.get('galleryComments').remove({ galleryId: req.params.id }).write();
    res.status(204).end();
  });

  router.post('/:id/like', writeLimiter, requireAuth, (req, res) => {
    const item = collection().find({ id: req.params.id }).value();
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    const likedBy = item.likedBy || [];
    const already = likedBy.includes(req.user.sub);
    const nextLikedBy = already ? likedBy.filter((id) => id !== req.user.sub) : [...likedBy, req.user.sub];
    collection().find({ id: req.params.id }).assign({ likedBy: nextLikedBy }).write();
    res.json({ liked: !already, likesCount: nextLikedBy.length });
  });

  router.post('/:id/download', writeLimiter, (req, res) => {
    const item = collection().find({ id: req.params.id }).value();
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    collection().find({ id: req.params.id }).assign({ downloads: (item.downloads || 0) + 1 }).write();
    res.json({ downloads: (item.downloads || 0) + 1 });
  });

  router.post('/:id/ai-description', requireAuth, async (req, res) => {
    const item = collection().find({ id: req.params.id }).value();
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    if (item.aiDescription) return res.json(item.aiDescription);

    try {
      const insights = await generateGalleryInsights(item);
      collection().find({ id: req.params.id }).assign({ aiDescription: insights }).write();
      res.json(insights);
    } catch (err) {
      const status = err.code === 'ANTHROPIC_NOT_CONFIGURED' ? 501 : 502;
      res.status(status).json({ message: err.message, code: err.code || 'AI_INSIGHTS_FAILED' });
    }
  });

  // ---------- comments ----------
  router.get('/:id/comments', (req, res) => {
    const comments = db.get('galleryComments')
      .filter((c) => c.galleryId === req.params.id && c.status !== 'removed')
      .value()
      .map((c) => ({ ...c, likesCount: c.likedBy?.length || 0 }));
    res.json(comments);
  });

  router.post('/:id/comments', writeLimiter, requireAuth, validate(galleryCommentSchema), (req, res) => {
    const item = collection().find({ id: req.params.id }).value();
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    const author = db.get('users').find({ id: req.user.sub }).value();
    const comment = {
      id: newCommentId(),
      galleryId: req.params.id,
      userId: req.user.sub,
      userName: author?.name || 'TourX traveller',
      text: req.body.text,
      parentCommentId: req.body.parentCommentId || null,
      likedBy: [],
      status: 'visible',
      createdAt: new Date().toISOString(),
    };
    db.get('galleryComments').push(comment).write();
    res.status(201).json({ ...comment, likesCount: 0 });
  });

  router.delete('/comments/:commentId', requireAuth, (req, res) => {
    const comment = db.get('galleryComments').find({ id: req.params.commentId }).value();
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId !== req.user.sub && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    }
    db.get('galleryComments').remove({ id: req.params.commentId }).write();
    res.status(204).end();
  });

  router.post('/comments/:commentId/like', requireAuth, (req, res) => {
    const comment = db.get('galleryComments').find({ id: req.params.commentId }).value();
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const likedBy = comment.likedBy || [];
    const already = likedBy.includes(req.user.sub);
    const nextLikedBy = already ? likedBy.filter((id) => id !== req.user.sub) : [...likedBy, req.user.sub];
    db.get('galleryComments').find({ id: req.params.commentId }).assign({ likedBy: nextLikedBy }).write();
    res.json({ liked: !already, likesCount: nextLikedBy.length });
  });

  router.post('/comments/:commentId/report', requireAuth, (req, res) => {
    const comment = db.get('galleryComments').find({ id: req.params.commentId }).value();
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    db.get('galleryComments').find({ id: req.params.commentId }).assign({ status: 'reported' }).write();
    res.json({ message: 'Comment reported for review.' });
  });

  return router;
};
