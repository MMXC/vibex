// Workaround for Next.js 16.2.0 generated validator.ts importing from 'next/server.js'
// which TypeScript's moduleResolution: "bundler" cannot resolve
declare module 'next/server.js' {
  export type { NextRequest } from 'next/server'
}
