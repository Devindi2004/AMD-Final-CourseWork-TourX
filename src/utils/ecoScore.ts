import type { ItineraryItem, PointOfInterest } from '../types';

const TRANSPORT_WEIGHTS: Record<string, number> = {
  walking: 10,
  bicycle: 8,
  train: 5,
  bus: 4,
  'public-bus': 4,
  tuktuk: -2,
  'tuk-tuk': -2,
  taxi: -6,
  'private-car': -8,
  car: -8,
  flight: -20,
};

const ECO_TAG_WEIGHTS: Record<string, number> = {
  'low-impact': 3,
  conservation: 3,
  walkable: 2,
  'bike-friendly': 2,
  'scenic-viewpoint': 1,
  safari: -3,
  'moderate-hike': 1,
};

/**
 * A deterministic, explainable stand-in for the proposal's "Eco Travel Score":
 * starts at a neutral baseline, then rewards low-impact transport modes and
 * activity types while penalising higher-emission choices. Clamped to 0-100.
 */
export function computeEcoScore(
  transportModes: string[],
  itineraryItems: ItineraryItem[],
  poisById: Record<string, PointOfInterest | undefined>
): number {
  let score = 60;

  transportModes.forEach((mode) => {
    score += TRANSPORT_WEIGHTS[mode.toLowerCase()] ?? 0;
  });

  itineraryItems.forEach((item) => {
    const poi = poisById[item.poiId];
    poi?.ecoTags.forEach((tag) => {
      score += ECO_TAG_WEIGHTS[tag] ?? 0;
    });
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function ecoScoreLabel(score: number): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (score >= 70) return { label: 'Great', tone: 'success' };
  if (score >= 45) return { label: 'Moderate', tone: 'warning' };
  return { label: 'High impact', tone: 'danger' };
}
