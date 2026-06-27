/*
  # Add RLS Policy for Shared Projects Visibility

  Problem: Invited users cannot view projects they're invited to, even when those projects have visibility='shared'.
  
  Root Cause: The projects table RLS policies only allow:
  1. Users viewing their own projects (auth.uid() = user_id)
  2. Everyone viewing public projects (visibility = 'public')
  
  Missing: A policy allowing invited users to view shared projects.
  
  Solution: Add a new SELECT policy that allows authenticated users to view projects where:
  - visibility = 'shared' AND
  - The user has an invitation (invited_email matches their email in project_shares table)
  
  Impact: This allows guest users (like synnfourup@gmail.com) to see projects they've been invited to,
  fixing the issue where 3 valid invitations result in 0 visible projects.
*/

CREATE POLICY "Invited users can view shared projects"
  ON projects FOR SELECT TO authenticated
  USING (
    visibility = 'shared' 
    AND EXISTS (
      SELECT 1 FROM project_shares 
      WHERE project_shares.project_id = projects.id 
      AND project_shares.invited_email = auth.email()
    )
  );
