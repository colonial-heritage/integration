import {run} from './fetcher.js';
import {mkdirp} from 'mkdirp';
import {copyFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const outputDir = './tmp/integration-test';
  const dirWithRuns = join(outputDir, 'runs');
  const fileWithMetadataOfChanges = join(outputDir, 'metadata.csv');

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
      fileWithMetadataOfChanges,
      waitBetweenRequests: 10,
    });

    const stats = await stat(fileWithMetadataOfChanges);

    expect(stats.size).toBeGreaterThan(0);
  });
});
