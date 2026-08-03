/**
 * Semantic icon paint — shared intent → Tailwind color classes.
 * Use for CTA / status lucide icons so deny/info/action stay consistent hub-wide.
 */
export type SemanticIconIntent = 'deny' | 'info' | 'navigate' | 'play' | 'neutral'

export const SEMANTIC_ICON_CLASS: Record<SemanticIconIntent, string> = {
  deny: 'text-accent-red',
  info: 'text-accent-blue',
  navigate: 'text-text-heading',
  play: 'text-accent-green',
  neutral: 'text-text-heading',
}

export function semanticIconClass(intent: SemanticIconIntent): string {
  return SEMANTIC_ICON_CLASS[intent]
}
