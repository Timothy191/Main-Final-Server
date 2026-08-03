'use client'

import Image from 'next/image'
import { Marquee } from '@repo/ui/Marquee'
import { GlassCard } from '@repo/ui/GlassCard'
import { DEPARTMENT_REVIEWS } from '@/data/reviews'
import React from 'react'

const firstRow = DEPARTMENT_REVIEWS.slice(0, DEPARTMENT_REVIEWS.length / 2)
const secondRow = DEPARTMENT_REVIEWS.slice(DEPARTMENT_REVIEWS.length / 2)

interface ReviewCardProps {
  img: string
  name: string
  username: string
  body: string
}

function ReviewCard({ img, name, username, body }: ReviewCardProps) {
  return (
    <div className="w-[300px] shrink-0">
      <GlassCard className="h-full bg-arch-surface-tertiary/40 border border-arch-border-primary hover:border-white/40 transition-all duration-300">
        <div className="p-4 flex flex-col justify-between h-full select-none">
          <div className="flex flex-row items-center gap-3">
            <Image
              className="rounded-full w-8 h-8 object-cover bg-arch-surface-tertiary border border-arch-border-primary"
              width={32}
              height={32}
              alt={name}
              src={img}
            />
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-arch-text-primary">{name}</span>
              <p className="text-[11px] font-medium text-arch-text-secondary">{username}</p>
            </div>
          </div>
          <blockquote className="mt-2.5 text-xs text-arch-text-secondary leading-relaxed text-left line-clamp-2">
            "{body}"
          </blockquote>
        </div>
      </GlassCard>
    </div>
  )
}

export function DepartmentReviews() {
  // AGENT-TRACE: Using CSS mask-image gradient to smoothly fade marquee edges over the dynamic background video
  const maskStyle = {
    maskImage: 'linear-gradient(to right, transparent, white 10%, white 90%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, white 10%, white 90%, transparent)',
  }

  return (
    <div
      className="space-y-4 animate-fade-up group/row"
      style={{ animationDelay: '0.05s', animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between pb-2 border-b border-arch-border-subtle">
        <h2 className="text-[17px] font-medium text-arch-text-primary">
          Operational Feedback & Department Logs
        </h2>
      </div>

      <div
        className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-transparent py-6"
        style={maskStyle}
      >
        <Marquee pauseOnHover className="[--duration:30s] gap-6 py-1">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:30s] gap-6 py-1">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
      </div>
    </div>
  )
}
