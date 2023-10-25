import {fetchMetadataAndWriteToFile} from './writer.js';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {glob} from 'glob';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('fetchMetadataAndWriteToFile', () => {
  const outputDir = './tmp/writer';
  const fileWithMetadata = join(outputDir, 'metadata.csv');
  const dirWithQueue = join(outputDir, 'queue');

  beforeEach(async () => {
    await rimraf(outputDir);
  });

  it('stores IRIs and actions of changed resources', async () => {
    const discoverer = new ChangeDiscoverer({
      collectionIri: 'https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes',
      dateLastRun: new Date('2023-10-01'),
      waitBetweenRequests: 10,
    });

    await fetchMetadataAndWriteToFile({
      discoverer,
      fileWithMetadata,
      dirWithQueue,
      numberOfLinesPerFileWithMetadata: 5,
    });

    const filesInQueue = await glob(`${dirWithQueue}/**`, {nodir: true});

    expect(filesInQueue.length).toBeGreaterThan(0);
  });
});
