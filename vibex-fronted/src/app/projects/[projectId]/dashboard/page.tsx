import { ProjectDashboardClient } from './ProjectDashboardClient';

// Required for static export - placeholder for build, uses client-side rendering at runtime
export function generateStaticParams() {
  return [{ projectId: 'placeholder' }];
}

export default function ProjectDashboard() {
  return <ProjectDashboardClient />;
}
