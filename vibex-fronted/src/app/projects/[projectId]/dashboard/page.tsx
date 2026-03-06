import { ProjectDashboardClient } from './ProjectDashboardClient';

// Required for static export
export function generateStaticParams() {
  return [];
}

export default function ProjectDashboard() {
  return <ProjectDashboardClient />;
}
