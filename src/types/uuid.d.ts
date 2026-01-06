// Minimal declaration to satisfy TS when bundler skips node types
declare module "uuid" {
  export function v4(): string;
}
