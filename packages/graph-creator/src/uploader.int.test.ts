import {run} from './uploader.js';
import {env} from 'node:process';
import {describe, expect, it} from 'vitest';

describe('run', () => {
  it('uploads a file', async () => {
    await expect(
      run({
        triplydbInstanceUrl: env.TRIPLYDB_INSTANCE_URL as string,
        triplydbApiToken: env.TRIPLYDB_API_TOKEN as string,
        triplydbAccount: env.TRIPLYDB_ACCOUNT_DEVELOPMENT as string,
        triplydbDataset: env.TRIPLYDB_DATASET_KG_DEVELOPMENT as string,
        triplydbServiceName: 'kg',
        triplydbServiceType: 'virtuoso',
        rdfFile: './fixtures/aat/terms.nt',
        graphName: 'https://data.colonialcollections.nl/aat-integration-test',
      })
    ).resolves.toBeUndefined();
  });

  it('uploads files in a directory', async () => {
    await expect(
      run({
        triplydbInstanceUrl: env.TRIPLYDB_INSTANCE_URL as string,
        triplydbApiToken: env.TRIPLYDB_API_TOKEN as string,
        triplydbAccount: env.TRIPLYDB_ACCOUNT_DEVELOPMENT as string,
        triplydbDataset: env.TRIPLYDB_DATASET_KG_DEVELOPMENT as string,
        triplydbServiceName: 'kg',
        triplydbServiceType: 'virtuoso',
        dir: './fixtures/geonames/files',
        graphName:
          'https://data.colonialcollections.nl/geonames-integration-test',
      })
    ).resolves.toBeUndefined();
  });
});
