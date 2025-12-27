declare module '@storybook/react' {
  // Tipos mÃ­nimos para permitir que las stories compilen sin instalar @types de Storybook
  export type Meta<_T = any> = any;
  export type StoryObj<_T = any> = any;
}

