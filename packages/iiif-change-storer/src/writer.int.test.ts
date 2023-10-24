import {fetchMetadataAndWriteToFile} from './writer.js';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {stat} from 'node:fs/promises';
import {WriteStream, createWriteStream} from 'node:fs';
import {mkdirp} from 'mkdirp';
import {beforeEach, describe, expect, it} from 'vitest';
import {dirname} from 'node:path';

describe('fetchMetadataAndWriteToFile', () => {
  const fileWithMetadata = './tmp/writer/metadata.csv';
  let writeStream: WriteStream;

  beforeEach(async () => {
    await mkdirp(dirname(fileWithMetadata));
    writeStream = createWriteStream(fileWithMetadata);
  });

  it('stores IRIs and actions of changed resources', async () => {
    const discoverer = new ChangeDiscoverer({
      collectionIri: 'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
      dateLastRun: new Date('2023-10-01'),
      waitBetweenRequests: 10,
    });

    await fetchMetadataAndWriteToFile({discoverer, writeStream});

    const stats = await stat(fileWithMetadata);

    expect(stats.size).toBeGreaterThan(0);
  });
});
