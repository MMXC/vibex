/**
 * POST /api/telemetry/errors
 * E010: Error telemetry endpoint for collecting client-side errors
 *
 * Receives error reports from client error boundaries.
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeError } from '@/lib/log-sanitizer';

export const dynamic = 'force-dynamic';

interface ErrorReport {
  message: string;
  digest?: string;
  stack?: string;
  source?: string;
  timestamp?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let report: ErrorReport;
    try {
      report = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    if (!report.message) {
      return NextResponse.json(
        { error: 'Missing required field: message', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    // Log error for server-side monitoring
    safeError('[telemetry/errors]', {
      message: report.message,
      digest: report.digest,
      source: report.source,
      timestamp: report.timestamp || new Date().toISOString(),
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    safeError('[telemetry/errors] Unexpected error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
