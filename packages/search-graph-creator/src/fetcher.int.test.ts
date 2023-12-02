import {run} from './fetcher.js';
import {copyFile, mkdir} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {env} from 'node:process';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

const outputDir = './tmp/fetcher';
const iriFile = join(outputDir, 'iris.txt');
const dirWithQueue = join(outputDir, 'queue');

beforeEach(async () => {
  await rimraf(outputDir);
});

describe('run', () => {
  const fileWithRun = join(outputDir, 'recent-run.nt');

  beforeEach(async () => {
    await mkdir(dirname(fileWithRun), {recursive: true});
    await copyFile('./fixtures/recent-run.nt', fileWithRun);
  });

  it('runs but aborts early because the dataset has not been changed since the last run', async () => {
    await run({
      fileWithRun,
      endpointUrl: env.SPARQL_ENDPOINT_KG_TESTING as string,
      datasetId: 'https://example.org/datasets/1',
      queryFile: './fixtures/iterate.rq',
      iriFile,
      dirWithQueue,
      numberOfLinesPerFileWithIris: 1,
    });
  });
});

describe('run', () => {
  const fileWithRun = join(outputDir, 'old-run.nt');

  beforeEach(async () => {
    await mkdir(dirname(fileWithRun), {recursive: true});
    await copyFile('./fixtures/old-run.nt', fileWithRun);
  });

  it('runs', async () => {
    await run({
      fileWithRun,
      endpointUrl: env.SPARQL_ENDPOINT_KG_TESTING as string,
      datasetId: 'https://example.org/datasets/1',
      queryFile: './fixtures/iterate.rq',
      iriFile,
      dirWithQueue,
      numberOfLinesPerFileWithIris: 1,
    });
  });
});
