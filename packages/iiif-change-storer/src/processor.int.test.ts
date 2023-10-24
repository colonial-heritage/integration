import {run} from './processor.js';
import {glob} from 'glob';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const outputDir = './tmp/processor';
  const dirWithFilesWithMetadata = join(outputDir, 'chunks');
  const dirWithChanges = join(outputDir, 'changes');

  beforeEach(async () => {
    await rimraf(outputDir);
  });

  it('processes changed resources', async () => {
    await run({
      fileWithMetadata: './fixtures/bodleian-metadata.csv',
      dirWithFilesWithMetadata,
      numberOfLinesPerFileWithMetadata: 2,
      dirWithChanges,
      waitBetweenRequests: 10,
      numberOfConcurrentRequests: 1,
    });

    const files = await glob(`${dirWithChanges}/**/*.nt`, {nodir: true});

    // This outcome could fail at some point, if the owner of the collection
    // makes the IRIs of its resources unresolvable
    expect(files.length).toBe(5); // 5x upsert, 5x delete
  });
});
