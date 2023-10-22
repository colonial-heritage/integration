import {run} from './fetcher.js';
import {mkdirp} from 'mkdirp';
import {copyFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const dir = './tmp/integration-test';
  const dirWithRuns = join(dir, 'runs');
  const fileWithChanges = join(dir, 'changed-resources.csv');

  beforeEach(async () => {
    await rimraf(dir);
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
      fileWithChanges,
      waitBetweenRequests: 10,
    });

    const stats = await stat(fileWithChanges);

    expect(stats.size).toBeGreaterThan(0);
  });
});
