// Stub declarations for @babel/traverse (used in security schema analysis)
declare module '@babel/traverse' {
  interface BabelPath {
    node: unknown;
    parent: unknown;
    skip(): void;
    remove(): void;
    replaceWith(node: unknown): void;
    traverse(node: unknown, opts?: unknown): void;
    isReferencedIdentifier(): boolean;
  }

  interface Visitor {
    [key: string]: (path: BabelPath) => void;
  }

  export default function traverse<S = unknown>(
    node: unknown,
    opts?: Visitor
  ): void;
}
