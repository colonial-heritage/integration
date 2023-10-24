import {run} from './fetcher.js';
import {mkdirp} from 'mkdirp';
import {copyFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const outputDir = './tmp/fetcher';
  const dirWithRuns = join(outputDir, 'runs');
  const fileWithMetadata = join(outputDir, 'metadata.csv');

  beforeEach(async () => {
    await rimraf(outputDir);
    await mkdirp(dirWithRuns);
    await copyFile(
      './fixtures/1695583064271.nt',
      join(dirWithRuns, '1695583064271.nt')
    );
  });

  it('runs', async () => {
    await run({
      collectionIri: 'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
      dirWithRuns,
      fileWithMetadata,
      waitBetweenRequests: 10,
    });

    const stats = await stat(fileWithMetadata);

    expect(stats.size).toBeGreaterThan(0);
  });
});
