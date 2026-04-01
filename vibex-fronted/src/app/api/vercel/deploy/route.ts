import { NextRequest, NextResponse } from 'next/server';
import { deployToVercel } from '@/lib/vercel-deploy';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('vercel_token')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Vercel not connected' }, { status: 401 });
  }
  
  try {
    const body = await request.json() as { projectId: string; framework?: string };
    const deployment = await deployToVercel({
      projectId: body.projectId,
      framework: body.framework || 'nextjs',
      token,
    });
    
    return NextResponse.json(deployment);
  } catch (err) {
    console.error('Deploy error:', err);
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 });
  }
}
