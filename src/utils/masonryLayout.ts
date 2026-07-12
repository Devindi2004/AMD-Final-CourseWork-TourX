import type { GalleryItem } from '../types';

const HEIGHT_CYCLE = [220, 160, 190, 240, 170];

/** Deterministic pseudo-varied card height so the grid reads as "large/medium/small" tiles. */
export function estimatedCardHeight(index: number): number {
  return HEIGHT_CYCLE[index % HEIGHT_CYCLE.length];
}

/** Greedy bin-packing into N columns by running height, for a Pinterest-style masonry grid. */
export function splitIntoColumns(items: GalleryItem[], columnCount = 2) {
  const columns: { item: GalleryItem; height: number }[][] = Array.from({ length: columnCount }, () => []);
  const columnHeights = new Array(columnCount).fill(0);

  items.forEach((item, index) => {
    const height = estimatedCardHeight(index);
    const shortest = columnHeights.indexOf(Math.min(...columnHeights));
    columns[shortest].push({ item, height });
    columnHeights[shortest] += height;
  });

  return columns;
}
