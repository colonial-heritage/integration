import {run} from './fetcher.js';
import {glob} from 'glob';
import {mkdirp} from 'mkdirp';
import {copyFile, cp} from 'node:fs/promises';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

const outputDir = './tmp/fetcher';
const dirWithRuns = join(outputDir, 'runs');
const fileWithMetadata = join(outputDir, 'metadata.csv');
const dirWithQueue = join(outputDir, 'queue');

beforeEach(async () => {
  await rimraf(outputDir);
});

describe('run', () => {
  beforeEach(async () => {
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
      dirWithQueue,
      numberOfLinesPerFileWithMetadata: 5,
      waitBetweenRequests: 10,
    });

    const filesInQueue = await glob(`${dirWithQueue}/**`, {nodir: true});

    expect(filesInQueue.length).toBeGreaterThan(0);
  });
});

describe('run', () => {
  beforeEach(async () => {
    await cp('./fixtures/queue', dirWithQueue, {recursive: true});
  });

  it('throws if queue is not empty', async () => {
    expect.assertions(1);

    try {
      await run({
        collectionIri:
          'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
        dirWithRuns,
        fileWithMetadata,
        dirWithQueue,
        numberOfLinesPerFileWithMetadata: 5,
        waitBetweenRequests: 10,
      });
    } catch (err) {
      const error = err as Error;
      expect(error.message).toEqual(
        'Cannot run: there are 5 files in the queue'
      );
    }
  });
});
