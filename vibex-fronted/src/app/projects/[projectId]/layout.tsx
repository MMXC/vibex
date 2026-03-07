import { ProjectLayoutClient } from './ProjectLayoutClient';

// Required for static export - placeholder for build, uses client-side rendering at runtime
export function generateStaticParams() {
  return [{ projectId: 'placeholder' }];
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProjectLayoutClient>{children}</ProjectLayoutClient>;
}
