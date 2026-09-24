import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queryDecisionService } from './decision.service';

describe('queryDecisionService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns null when DECISION_SERVICE_URL is not set in non-dev env', async () => {
    delete process.env.DECISION_SERVICE_URL;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const result = await queryDecisionService('בדיקה');
    expect(result).toBeNull();
  });

  it('fetches decision successfully when service responds ok', async () => {
    process.env.DECISION_SERVICE_URL = 'http://localhost:8100';

    const mockResponse = {
      tier: 'tier2_laya',
      action: 'pick_option',
      phase: 'intake',
      confidence: 0.95,
      latency_ms: 38.2,
      fallback_to_llm: false,
      details: {},
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await queryDecisionService('אני מעדיף את הראשון');
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8100/decide',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('gracefully returns null if fetch throws an error or aborts', async () => {
    process.env.DECISION_SERVICE_URL = 'http://localhost:8100';
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const result = await queryDecisionService('שלום');
    expect(result).toBeNull();
  });
});
