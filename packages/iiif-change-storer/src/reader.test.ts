import {ChangeReader} from './reader.js';
import {pino} from 'pino';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const dirWithChanges = './tmp/changes';

  beforeEach(async () => {
    await rimraf(dirWithChanges);
  });

  it('stores IRIs and change types of changed resources', async () => {
    const reader = new ChangeReader({
      logger: pino(),
    });

    await reader.run({
      dirWithFiles: './fixtures/csv',
      dirWithChanges,
    });
  });
});
