-- Migration: Annotation GitHub Integration
-- Created for: Sprint91 E2 (GitHub Design Review Loop)
-- Version: 0025

-- Add GitHub Issue URL and GitHub Commit SHA columns to annotations table
ALTER TABLE annotations ADD COLUMN github_issue_url TEXT;
ALTER TABLE annotations ADD COLUMN github_issue_number INTEGER;
ALTER TABLE annotations ADD COLUMN github_commit_sha TEXT;
CREATE INDEX IF NOT EXISTS idx_annotations_github_issue ON annotations(github_issue_url) WHERE github_issue_url IS NOT NULL;
