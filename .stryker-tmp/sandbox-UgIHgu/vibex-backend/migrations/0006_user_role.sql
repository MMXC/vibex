-- Migration: Add role field to User table
-- Date: 2026-03-04

-- Add role column with default value 'viewer'
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'viewer';
