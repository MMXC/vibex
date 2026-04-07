/**
 * Supabase Client Configuration
 * For vibex-phase2-core-20260316 project
 * 
 * This module provides Supabase client initialization and configuration
 * for the Vibex application.
 */
// @ts-nocheck


import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables (should be set in .env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Browser/client-side Supabase client
 * Uses anon key for public operations
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Server-side Supabase client with service role privileges
 * Use only in trusted server contexts (API routes, background jobs)
 */
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-service-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Type definitions for Supabase tables
 */
export type AuthUser = Database['public']['Tables']['auth_users']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type BoundedContext = Database['public']['Tables']['bounded_contexts']['Row'];
export type DomainModel = Database['public']['Tables']['domain_models']['Row'];
export type DomainProperty = Database['public']['Tables']['domain_properties']['Row'];
export type DomainMethod = Database['public']['Tables']['domain_methods']['Row'];
export type Flow = Database['public']['Tables']['flows']['Row'];
export type Page = Database['public']['Tables']['pages']['Row'];
export type Collaboration = Database['public']['Tables']['collaborations']['Row'];
export type CollaborationParticipant = Database['public']['Tables']['collaboration_participants']['Row'];
export type CollaborationPresence = Database['public']['Tables']['collaboration_presence']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

/**
 * Database schema version tracking
 */
export const SCHEMA_VERSION = '001';

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
