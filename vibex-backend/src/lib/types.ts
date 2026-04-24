/**
 * Supabase Database Type Definitions
 * Stub types for supabase client type safety
 */

/* eslint-disable @typescript-eslint/no-empty-interface */

export interface Database {
  public: {
    Tables: {
      [table: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [_ in string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [_ in string]: unknown
    }
    Enums: {
      [_ in string]: string
    }
  }
}
