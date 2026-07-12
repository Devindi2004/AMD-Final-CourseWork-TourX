const { z } = require('zod');

const GALLERY_CATEGORIES = [
  'Beaches', 'Waterfalls', 'Mountains', 'Wildlife', 'Heritage',
  'Religious Places', 'Cities', 'Adventure', 'Food', 'Hotels',
  'Camping', 'National Parks',
];

const GALLERY_SORTS = ['newest', 'oldest', 'popular', 'trending'];

const galleryCreateSchema = z.object({
  imageUrl: z.string().url(),
  title: z.string().min(2, 'Title is required'),
  category: z.enum(GALLERY_CATEGORIES),
  district: z.string().min(1, 'District is required'),
  province: z.string().min(1, 'Province is required'),
  description: z.string().optional().default(''),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  photographer: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  entryFee: z.enum(['free', 'paid']).optional().default('free'),
  familyFriendly: z.boolean().optional().default(true),
});

const galleryUpdateSchema = galleryCreateSchema.partial();

const galleryCommentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(1000),
  parentCommentId: z.string().optional().nullable(),
});

module.exports = {
  GALLERY_CATEGORIES,
  GALLERY_SORTS,
  galleryCreateSchema,
  galleryUpdateSchema,
  galleryCommentSchema,
};
