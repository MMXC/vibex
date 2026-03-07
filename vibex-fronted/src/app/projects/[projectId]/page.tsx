import { ProjectPageClient } from './ProjectPageClient';

// Required for static export - placeholder for build, uses client-side rendering at runtime
export function generateStaticParams() {
  // Return placeholder ID for build; actual data loaded client-side
  return [{ projectId: 'placeholder' }];
}

export default function ProjectPage() {
  return <ProjectPageClient />;
}
