// GET /api/analytics/funnel?range=7d|30d
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') ?? '7d';

  // Simulate funnel data (in real app, would aggregate from events table)
  // Funnel stages: 访问 → 画布打开 → 组件创建 → 交付导出
  const totalVisitors = Math.floor(Math.random() * 5000) + 1000;
  const canvasOpens = Math.floor(totalVisitors * 0.7);
  const componentCreates = Math.floor(canvasOpens * 0.4);
  const deliveryExports = Math.floor(componentCreates * 0.2);

  const steps = [
    { name: '访问', count: totalVisitors, rate: 1.0 },
    { name: '画布打开', count: canvasOpens, rate: canvasOpens / totalVisitors },
    { name: '组件创建', count: componentCreates, rate: componentCreates / totalVisitors },
    { name: '交付导出', count: deliveryExports, rate: deliveryExports / totalVisitors },
  ];

  return Response.json({ success: true, data: { steps } });
}
