import {run} from './fetcher.js';
import {glob} from 'glob';
import {copyFile, cp, mkdir} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

const outputDir = './tmp/fetcher';
const fileWithRun = join(outputDir, 'run.nt');
const fileWithMetadata = join(outputDir, 'metadata.csv');
const dirWithQueue = join(outputDir, 'queue');

beforeEach(async () => {
  await rimraf(outputDir);
});

describe('run', () => {
  beforeEach(async () => {
    await mkdir(dirname(fileWithRun), {recursive: true});
    await copyFile('./fixtures/run.nt', fileWithRun);
  });

  it('runs', async () => {
    await run({
      collectionIri: 'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
      fileWithRun,
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
        fileWithRun,
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
