'use client'

import * as React from 'react'

type AnyProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  // framer-motion props we ignore in the shim
  initial?: unknown
  animate?: unknown
  exit?: unknown
  transition?: unknown
  whileHover?: unknown
  whileTap?: unknown
  whileFocus?: unknown
  layout?: unknown
  layoutId?: unknown
  variants?: unknown
  custom?: unknown
}

function createMotionTag(Tag: keyof React.JSX.IntrinsicElements) {
  const Comp = React.forwardRef<HTMLElement, AnyProps>(function MotionShim(
    { children, className, style, ...rest },
    ref
  ) {
    // Strip motion-only props
    const {
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      whileHover: _wh,
      whileTap: _wt,
      whileFocus: _wf,
      layout: _l,
      layoutId: _lid,
      variants: _v,
      custom: _c,
      ...dom
    } = rest
    return React.createElement(Tag, { ref, className, style, ...dom }, children)
  })
  Comp.displayName = `motion.${Tag}`
  return Comp
}

export const motion = {
  div: createMotionTag('div'),
  span: createMotionTag('span'),
  button: createMotionTag('button'),
  a: createMotionTag('a'),
  ul: createMotionTag('ul'),
  li: createMotionTag('li'),
  nav: createMotionTag('nav'),
  header: createMotionTag('header'),
  section: createMotionTag('section'),
  p: createMotionTag('p'),
} as const

export type HTMLMotionProps<T extends keyof React.JSX.IntrinsicElements> =
  React.ComponentPropsWithoutRef<T> & AnyProps

export function useMotionValue(initial: number | string = 0) {
  const ref = React.useRef({
    get: () => initial,
    set: (_v: number | string) => undefined,
    getVelocity: () => 0,
  })
  return ref.current
}

export function useMotionTemplate(_strings: TemplateStringsArray, ..._values: unknown[]): string {
  return ''
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function useSpring(value: unknown) {
  return value
}

export function useTransform(value: unknown, ..._rest: unknown[]) {
  return value
}
