import {fetchChangesAndWriteToFile} from './writer.js';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {stat} from 'node:fs/promises';
import {WriteStream, createWriteStream} from 'node:fs';
import {beforeEach, describe, expect, it} from 'vitest';

describe('fetchChangesAndWriteToFile', () => {
  const fileWithMetadataOfChanges = './tmp/metadata.csv';
  let writeStream: WriteStream;

  beforeEach(() => {
    writeStream = createWriteStream(fileWithMetadataOfChanges);
  });

  it('stores IRIs and actions of changed resources', async () => {
    const discoverer = new ChangeDiscoverer({
      collectionIri: 'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
      dateLastRun: new Date('2023-10-01'),
      waitBetweenRequests: 10,
    });

    await fetchChangesAndWriteToFile({discoverer, writeStream});

    const stats = await stat(fileWithMetadataOfChanges);

    expect(stats.size).toBeGreaterThan(0);
  });
});
