import {run} from './uploader.js';
import {env} from 'node:process';
import {describe, expect, it} from 'vitest';

describe('run', () => {
  it('runs', async () => {
    await expect(
      run({
        triplydbInstanceUrl: env.TRIPLYDB_INSTANCE_URL as string,
        triplydbApiToken: env.TRIPLYDB_API_TOKEN as string,
        triplydbAccount: env.TRIPLYDB_ACCOUNT as string,
        triplydbDataset: env.TRIPLYDB_DATASET as string,
        triplydbServiceName: 'kg',
        triplydbServiceType: 'virtuoso',
        filePattern: './fixtures/files/deep/*',
      })
    ).resolves.toBeUndefined();
  });
});
