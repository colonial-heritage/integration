import {ChangeStorer} from './storer.js';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {stat} from 'node:fs/promises';
import {WriteStream, createWriteStream} from 'node:fs';
import {pino} from 'pino';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const changesFile = './tmp/changes.csv';
  let writeStream: WriteStream;

  beforeEach(() => {
    writeStream = createWriteStream(changesFile);
  });

  it('stores IRIs and change types of changed resources', async () => {
    const discoverer = new ChangeDiscoverer({
      collectionIri: 'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
      dateLastRun: new Date('2023-10-01'),
      waitBetweenRequests: 100,
    });

    const storer = new ChangeStorer({
      logger: pino(),
      discoverer,
      writeStream,
    });

    await storer.run();

    const stats = await stat(changesFile);

    expect(stats.size).toBeGreaterThan(16); // Contents minus the CSV header
  });
});
