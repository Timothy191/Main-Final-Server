'use client'

import React, { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react'

// =============================================================================
// Flow Edge Component
// =============================================================================

export const FlowEdge = memo(function FlowEdge({
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#007aff' : '#a1a1a6',
          strokeWidth: selected ? 3 : 2,
          transition: 'all 0.2s ease',
        }}
      />
      <EdgeLabelRenderer>
        {/* xyflow requires dynamic pixel positioning for edge labels */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            fontWeight: 500,
            pointerEvents: 'all',
          }}
          className={`
            px-2 py-0.5 rounded-full border border-black/[0.08]
            bg-white/80 backdrop-blur-xl
            text-[#6e6e73]
            ${selected ? 'text-[#007aff] border-[#007aff]/30' : ''}
          `}
        >
          flow
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

export default FlowEdge
