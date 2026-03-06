import { ProjectPageClient } from './ProjectPageClient'

// Required for static export
export function generateStaticParams() {
  return []
}

export default function ProjectPage() {
  return <ProjectPageClient />
}