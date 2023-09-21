import {run} from './discoverer.js';
import {glob} from 'glob';
import {mkdirp} from 'mkdirp';
import {copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const dir = './tmp/integration-test';

  beforeEach(async () => {
    await rimraf(dir);
    await mkdirp(join(dir, 'runs'));
    await copyFile('./fixtures/20230906.nt', join(dir, 'runs', '20230906.nt'));
  });

  it('runs', async () => {
    await run({
      collectionIri: 'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
      dir,
      waitBetweenRequests: 500,
      numberOfConcurrentRequests: 1,
    });

    const files = await glob(`${dir}/**/*.nt`, {nodir: true});

    // This outcome could fail at some point, if the owner of the collection
    // deletes all of its records
    expect(files.length).toBeGreaterThan(1);
  });
});
