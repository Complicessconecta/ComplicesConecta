declare module "@storybook/react" {
  // Tipos mínimos para permitir que las stories compilen sin instalar @types de Storybook
  export type Meta<_T = unknown> = Record<string, unknown>;
  export type StoryObj<_T = unknown> = Record<string, unknown>;
}
