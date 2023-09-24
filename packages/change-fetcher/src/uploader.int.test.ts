import {run} from './uploader.js';
import {env} from 'node:process';
import {describe, expect, it} from 'vitest';

describe('run', () => {
  it('runs', async () => {
    await expect(
      run({
        triplydbInstanceUrl: env.TRIPLYDB_INSTANCE_URL as string,
        triplydbApiToken: env.TRIPLYDB_API_TOKEN as string,
        triplydbAccount: env.TRIPLYDB_ACCOUNT_DEVELOPMENT as string,
        triplydbDataset: env.TRIPLYDB_DATASET_KG_DEVELOPMENT as string,
        dirWithChanges: './fixtures/uploader/files',
        graphName:
          'https://data.colonialcollections.nl/change-discoverer-integration-test',
      })
    ).resolves.toBeUndefined();
  });

  it('does not upload if there are no files in the target directory', async () => {
    await expect(
      run({
        triplydbInstanceUrl: env.TRIPLYDB_INSTANCE_URL as string,
        triplydbApiToken: env.TRIPLYDB_API_TOKEN as string,
        triplydbAccount: env.TRIPLYDB_ACCOUNT_DEVELOPMENT as string,
        triplydbDataset: env.TRIPLYDB_DATASET_KG_DEVELOPMENT as string,
        dirWithChanges: './fixtures/uploader/no-files',
        graphName:
          'https://data.colonialcollections.nl/change-discoverer-integration-test',
      })
    ).resolves.toBeUndefined();
  });
});
