'use client';

const templates = [
  { id: '1', name: '博客', description: '个人博客模板', image: '📝' },
  { id: '2', name: '电商', description: '电商网站模板', image: '🛒' },
  { id: '3', name: '企业官网', description: '企业展示网站', image: '🏢' },
  { id: '4', name: '仪表盘', description: '数据仪表盘', image: '📊' },
  { id: '5', name: '社交', description: '社交媒体模板', image: '💬' },
  { id: '6', name: '教育', description: '在线教育平台', image: '📚' },
];

export default function Templates() {
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px' }}>模板库</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
        }}
      >
        {templates.map((template) => (
          <div
            key={template.id}
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            <div
              style={{
                height: '160px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}
            >
              {template.image}
            </div>
            <div style={{ padding: '16px' }}>
              <h3 style={{ marginBottom: '8px' }}>{template.name}</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {template.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
