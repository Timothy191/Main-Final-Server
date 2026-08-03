declare module '@storybook/react' {
  import type { ComponentType } from 'react'
  export type Meta<T = any> = {
    title?: string
    component?: T
    parameters?: Record<string, any>
    decorators?: Array<(_Story: ComponentType) => any>
  }
  export type StoryObj<_T = any> = {
    render?: (_args?: any) => any
    args?: Record<string, any>
  }
}

declare module '@inference/tracing' {
  export function setup(config: { autoInstrument: boolean }): Promise<void>
}
