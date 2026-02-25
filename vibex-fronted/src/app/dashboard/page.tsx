import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  updatedAt: string
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'VibeX Playground',
    description: 'AI Agent Flow Builder',
    updatedAt: '2026-02-25',
  },
]

export default function Dashboard() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600' }}>我的项目</h1>
        <button
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          创建新项目
        </button>
      </header>

      <section>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>项目列表</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {mockProjects.map((project) => (
            <Link
              key={project.id}
              href="/chat"
              style={{
                display: 'block',
                padding: '20px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s',
              }}
            >
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
                {project.name}
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {project.description}
              </p>
              <p style={{ color: '#999', fontSize: '12px', marginTop: '12px' }}>
                更新于 {project.updatedAt}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
