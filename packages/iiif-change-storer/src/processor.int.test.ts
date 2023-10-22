import {run} from './processor.js';
import {glob} from 'glob';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const outputDir = './tmp/integration-test';
  const dirWithChanges = join(outputDir, 'changes');

  beforeEach(async () => {
    await rimraf(outputDir);
  });

  it('processes changed resources', async () => {
    await run({
      dirWithFilesWithMetadataOfChanges: './fixtures/csv',
      dirWithChanges,
      waitBetweenRequests: 10,
      numberOfConcurrentRequests: 1,
    });

    const files = await glob(`${dirWithChanges}/**/*.nt`, {nodir: true});

    // This outcome could fail at some point, if the owner of the collection
    // deletes all of its records
    expect(files.length).toBe(5); // 5x upsert, 5x delete
  });
});
