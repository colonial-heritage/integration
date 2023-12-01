import {shouldDoNewRun} from './checker.js';
import {env} from 'node:process';
import {describe, expect, it} from 'vitest';

describe('shouldDoNewRun', () => {
  it('returns false if it should not do a new run', async () => {
    const shouldRun = await shouldDoNewRun({
      endpointUrl: env.SPARQL_ENDPOINT_KG_TESTING as string,
      datasetId: 'https://example.org/datasets/1',
      dateLastRun: new Date(), // "Now"
    });

    expect(shouldRun).toBe(false);
  });

  it('returns true if it should do a new run', async () => {
    const shouldRun = await shouldDoNewRun({
      endpointUrl: env.SPARQL_ENDPOINT_KG_TESTING as string,
      datasetId: 'https://example.org/datasets/1',
      dateLastRun: new Date('1970-01-01'), // Arbitrary date in the past
    });

    expect(shouldRun).toBe(true);
  });
});
