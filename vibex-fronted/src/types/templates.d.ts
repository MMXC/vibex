// Template string declarations — E1 Design-to-Code Pipeline
// Allows importing .hbs files as strings via TypeScript
declare module '*.hbs' {
  const content: string;
  export default content;
}
