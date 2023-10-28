import {run} from './processor.js';
import {glob} from 'glob';
import {cp} from 'node:fs/promises';
import {join} from 'node:path';
import {mkdirp} from 'mkdirp';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

const outputDir = './tmp/processor';
const dirWithResources = join(outputDir, 'resources');

beforeEach(async () => {
  await rimraf(outputDir);
});

describe('run', () => {
  const dirWithQueue = join(outputDir, 'queue');

  beforeEach(async () => {
    // The files in the queue get deleted at the end of the test, so work on a copy
    await cp('./fixtures/queue', dirWithQueue, {recursive: true});
  });

  it('processes a selection of changed resources', async () => {
    await run({
      dirWithQueue,
      numberOfFilesToProcess: 2,
      dirWithResources,
    });

    const changedResourceFiles = await glob(`${dirWithResources}/**/*.nt`, {
      nodir: true,
    });

    // This outcome could fail at some point, if the owner of the collection
    // makes the IRIs of its resources unresolvable
    expect(changedResourceFiles.length).toBe(2); // 2x upsert, 2x delete

    const filesRemainingInQueue = await glob(`${dirWithQueue}/**`, {
      nodir: true,
    });

    expect(filesRemainingInQueue).toStrictEqual([
      'tmp/processor/queue/metadata-5.csv',
      'tmp/processor/queue/metadata-4.csv',
      'tmp/processor/queue/metadata-3.csv',
    ]);
  });

  it('processes all changed resources', async () => {
    await run({
      dirWithQueue,
      dirWithResources,
    });

    const changedResourceFiles = await glob(`${dirWithResources}/**/*.nt`, {
      nodir: true,
    });

    // This outcome could fail at some point, if the owner of the collection
    // makes the IRIs of its resources unresolvable
    expect(changedResourceFiles.length).toBe(5); // 5x upsert, 5x delete

    const filesRemainingInQueue = await glob(`${dirWithQueue}/**`, {
      nodir: true,
    });

    expect(filesRemainingInQueue.length).toBe(0);
  });
});

describe('run', () => {
  const dirWithQueue = join(outputDir, 'empty-queue');

  beforeEach(async () => {
    await mkdirp(dirWithQueue);
  });

  it('handles an empty queue correctly', async () => {
    await run({
      dirWithQueue,
      dirWithResources,
    });

    const changedResourceFiles = await glob(`${dirWithResources}/**/*.nt`, {
      nodir: true,
    });

    expect(changedResourceFiles.length).toBe(0);
  });
});
