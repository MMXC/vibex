import { ProjectLayoutClient } from './ProjectLayoutClient'

// Required for static export
export function generateStaticParams() {
  return []
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProjectLayoutClient>{children}</ProjectLayoutClient>
}
