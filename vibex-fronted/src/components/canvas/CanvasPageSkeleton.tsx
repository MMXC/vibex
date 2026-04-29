'use client';
/**
 * CanvasPageSkeleton — Skeleton loading placeholder for CanvasPage
 *
 * Shown while useProjectLoader is in loading state.
 * Mirrors the three-panel layout of the canvas.
 */
import React from 'react';
import { SkeletonLine, SkeletonBox } from '@/components/ui/Skeleton';

export function CanvasPageSkeleton() {
  return (
    <div className="flex h-full w-full gap-2 p-2">
      {/* Left panel: Bounded Context Tree */}
      <div className="flex flex-col w-64 shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col gap-2">
          <SkeletonLine width="60%" height={16} />
          <SkeletonLine width="40%" height={12} />
          <div className="mt-2 space-y-2">
            <SkeletonLine width="80%" height={14} />
            <SkeletonLine width="70%" height={14} />
            <SkeletonLine width="85%" height={14} />
            <SkeletonLine width="50%" height={14} />
          </div>
        </div>
      </div>

      {/* Center panel: Business Flow + Component */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex-1 flex flex-col gap-2">
          <SkeletonLine width="50%" height={16} />
          <div className="flex-1 flex items-center justify-center">
            <SkeletonBox width={200} height={120} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex-1 flex flex-col gap-2">
          <SkeletonLine width="45%" height={16} />
          <div className="flex-1 flex items-center justify-center">
            <SkeletonBox width={200} height={120} />
          </div>
        </div>
      </div>

      {/* Right panel: Properties */}
      <div className="flex flex-col w-64 shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col gap-2">
          <SkeletonLine width="50%" height={16} />
          <SkeletonLine width="70%" height={12} />
          <div className="mt-2 space-y-3">
            <SkeletonLine width="90%" height={12} />
            <SkeletonLine width="60%" height={12} />
            <SkeletonLine width="80%" height={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
