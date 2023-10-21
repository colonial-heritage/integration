import {ChangeWriter} from './writer.js';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {stat} from 'node:fs/promises';
import {WriteStream, createWriteStream} from 'node:fs';
import {pino} from 'pino';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const changedResourcesFile = './tmp/changed-resources.csv';
  let writeStream: WriteStream;

  beforeEach(() => {
    writeStream = createWriteStream(changedResourcesFile);
  });

  it('stores IRIs and actions of changed resources', async () => {
    const discoverer = new ChangeDiscoverer({
      collectionIri: 'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
      dateLastRun: new Date('2023-10-01'),
      waitBetweenRequests: 100,
    });

    const writer = new ChangeWriter({
      logger: pino(),
      discoverer,
      writeStream,
    });

    await writer.run();

    const stats = await stat(changedResourcesFile);

    expect(stats.size).toBeGreaterThan(16); // Contents minus the CSV header
  });
});
