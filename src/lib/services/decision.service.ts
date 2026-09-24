export interface RemoteDecisionResult {
  tier: string;
  action: string;
  phase: string;
  confidence: number;
  latency_ms: number;
  fallback_to_llm: boolean;
  details: Record<string, unknown>;
}

export async function queryDecisionService(
  text: string,
  context?: Record<string, unknown>
): Promise<RemoteDecisionResult | null> {
  const serviceUrl =
    process.env.DECISION_SERVICE_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8100' : '');

  if (!serviceUrl) {
    return null;
  }

  const cleanUrl = serviceUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800);

  try {
    const res = await fetch(`${cleanUrl}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, context }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as RemoteDecisionResult;
    return data;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
