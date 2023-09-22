import {pino} from 'pino';
import {TriplyDb} from './triplydb.js';
import {beforeAll, describe, expect, it} from 'vitest';
import {env} from 'node:process';

let triplyDb: TriplyDb;

beforeAll(async () => {
  triplyDb = await TriplyDb.new({
    logger: pino(),
    instanceUrl: env.TRIPLYDB_INSTANCE_URL as string,
    apiToken: env.TRIPLYDB_API_TOKEN as string,
    account: env.TRIPLYDB_ACCOUNT_DEVELOPMENT as string,
    dataset: env.TRIPLYDB_DATASET_KG_DEVELOPMENT as string,
  });
});

describe('upsertGraphFromFile', () => {
  it('upserts a graph from a file', async () => {
    await expect(
      triplyDb.upsertGraphFromFile({
        file: './fixtures/graph.nt',
        graph: 'https://example.org/integration-test',
      })
    ).resolves.toBeUndefined();
  });
});

describe('restartService', () => {
  it('restarts a service', async () => {
    await expect(
      triplyDb.restartService({
        name: 'kg',
        type: 'virtuoso',
      })
    ).resolves.toBeUndefined();
  });
});
