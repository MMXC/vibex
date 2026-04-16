/**
 * DDS API Proxy — vibex-fix-canvas-bugs Bug1
 *
 * B1: DDS API 404 修复
 * 根因: Cloudflare Pages `_redirects` 对 Next.js SSR `/api/v1/*` 重写不稳定
 * 解决方案: Next.js API 路由代理，将 `/api/v1/dds/*` 转发到后端
 *
 * Cloudflare Pages 路由: `/api/*` → `https://api.vibex.top/api/:splat` (不稳定)
 * Next.js 代理: 路由在 Next.js 服务端处理，完全绕过 Cloudflare 重写
 *
 * 支持方法: GET, POST, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.vibex.top/api';

export async function GET(request: NextRequest) {
  const splat = request.nextUrl.pathname.replace('/api/v1/dds/', '');
  const search = request.nextUrl.search;
  const url = `${BACKEND_BASE}/v1/dds/${splat}${search}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: 'DDS proxy error', detail: String(err) }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const splat = request.nextUrl.pathname.replace('/api/v1/dds/', '');
  const url = `${BACKEND_BASE}/v1/dds/${splat}`;
  const body = await request.text();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      credentials: 'include',
      body,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: 'DDS proxy error', detail: String(err) }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  const splat = request.nextUrl.pathname.replace('/api/v1/dds/', '');
  const url = `${BACKEND_BASE}/v1/dds/${splat}`;
  const body = await request.text();

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      credentials: 'include',
      body,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: 'DDS proxy error', detail: String(err) }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const splat = request.nextUrl.pathname.replace('/api/v1/dds/', '');
  const search = request.nextUrl.search;
  const url = `${BACKEND_BASE}/v1/dds/${splat}${search}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json({ error: 'DDS proxy error', detail: String(err) }, { status: 502 });
  }
}
