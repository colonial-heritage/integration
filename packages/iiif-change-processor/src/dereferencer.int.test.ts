import {run} from './dereferencer.js';
import {glob} from 'glob';
import {existsSync} from 'node:fs';
import {copyFile, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const outputDir = './tmp/dereferencer';
  const dirWithResources = join(outputDir, 'resources');
  const fileWithMetadata = join(outputDir, 'bodleian-metadata.csv');

  beforeEach(async () => {
    await rimraf(outputDir);
    await mkdir(dirWithResources, {recursive: true});

    // 'fileWithMetadata' gets deleted at the end of the test, so work on a copy
    await copyFile('./fixtures/bodleian-metadata.csv', fileWithMetadata);
  });

  it('dereferences and stores changed resources', async () => {
    await run({
      fileWithMetadata,
      dirWithResources,
      waitBetweenRequests: 10,
      numberOfConcurrentRequests: 1,
    });

    const changedResourceFiles = await glob(`${dirWithResources}/**/*.nt`, {
      nodir: true,
    });

    // This outcome could fail at some point, if the owner of the collection
    // deletes all of its records
    expect(changedResourceFiles.length).toBe(5); // 5x upsert, 5x delete

    expect(existsSync(fileWithMetadata)).toBe(false);
  });
});
