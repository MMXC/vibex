'use client';

/**
 * reviewDiff — E2-Design-Review-Diff S2.3
 *
 * Computes the diff between two design review reports.
 * Based on item.id comparison:
 * - Same id, different severity/message/location → changed (added + removed)
 * - New has, old doesn't → added
 * - Old has, new doesn't → removed
 * - Both have, identical → unchanged
 */

import type { DesignReviewIssue, DesignReviewRecommendation, DesignReviewResult } from '@/hooks/useDesignReview';

// Flatten a DesignReviewResult into ReviewItem[]
export interface ReviewItem {
  id: string;
  severity?: string;
  message: string;
  location?: string;
  priority?: string;
  score?: number;
}

export interface ReviewDiff {
  added: ReviewItem[];
  removed: ReviewItem[];
  unchanged: ReviewItem[];
}

function flattenResult(result: DesignReviewResult): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const issue of result.compliance) {
    items.push({
      id: issue.id,
      severity: issue.severity,
      message: issue.message,
      location: issue.location,
      score: 1,
    });
  }

  for (const issue of result.accessibility) {
    items.push({
      id: issue.id,
      severity: issue.severity,
      message: issue.message,
      location: issue.location,
      score: 1,
    });
  }

  for (const rec of result.reuse) {
    items.push({
      id: rec.id,
      severity: rec.priority,
      message: rec.message,
      priority: rec.priority,
      score: 1,
    });
  }

  return items;
}

export function computeReviewDiff(
  newResult: DesignReviewResult,
  oldResult: DesignReviewResult,
): ReviewDiff {
  const newItems = flattenResult(newResult);
  const oldItems = flattenResult(oldResult);

  const newMap = new Map(newItems.map((item) => [item.id, item]));
  const oldMap = new Map(oldItems.map((item) => [item.id, item]));

  const added: ReviewItem[] = [];
  const removed: ReviewItem[] = [];
  const unchanged: ReviewItem[] = [];

  // Items in new report
  for (const [id, newItem] of newMap) {
    if (!oldMap.has(id)) {
      // New item not in old → added
      added.push(newItem);
    } else {
      // Exists in both — check if changed
      const oldItem = oldMap.get(id)!;
      if (
        newItem.severity !== oldItem.severity ||
        newItem.message !== oldItem.message ||
        newItem.location !== oldItem.location
      ) {
        // Changed → added (new version) + removed (old version)
        added.push(newItem);
        removed.push(oldItem);
      } else {
        unchanged.push(newItem);
      }
    }
  }

  // Items only in old report → removed
  for (const [id, oldItem] of oldMap) {
    if (!newMap.has(id)) {
      removed.push(oldItem);
    }
  }

  return { added, removed, unchanged };
}
