import {run} from './dereferencer.js';
import {glob} from 'glob';
import {mkdirp} from 'mkdirp';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const outputDir = './tmp/integration-test';
  const dirWithChanges = join(outputDir, 'changes');

  beforeEach(async () => {
    await rimraf(outputDir);
    await mkdirp(dirWithChanges);
  });

  it('dereferences and stores changed resources', async () => {
    await run({
      fileWithMetadataOfChanges: './fixtures/bodleian-metadata.csv',
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
