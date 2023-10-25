import {splitFileByLines} from './splitter.js';
import {getLogger} from '@colonial-collections/common';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {stringify} from 'csv';
import {mkdirp} from 'mkdirp';
import {once} from 'node:events';
import {createWriteStream} from 'node:fs';
import {dirname} from 'node:path';
import {finished} from 'node:stream/promises';
import {z} from 'zod';

const optionsSchema = z.object({
  discoverer: z.instanceof(ChangeDiscoverer),
  fileWithMetadata: z.string(),
  dirWithQueue: z.string(),
  numberOfLinesPerFileWithMetadata: z.number(),
});

export type Options = z.infer<typeof optionsSchema>;

export async function fetchMetadataAndWriteToFile(options: Options) {
  const opts = optionsSchema.parse(options);

  const {discoverer, fileWithMetadata} = opts;
  const logger = getLogger();

  // Before fetching changes, configure a temporary output destination: a CSV file
  await mkdirp(dirname(fileWithMetadata));
  const writeStream = createWriteStream(fileWithMetadata);
  const stringifier = stringify();
  stringifier.on('error', (err: Error) => logger.error(err));

  // First write changes to intermediate CSV transformer
  const writeChange = async (iri: string, action: string) => {
    if (!stringifier.write([iri, action])) {
      await once(stringifier, 'drain'); // Handle backpressure
    }
  };

  // Then read changes from CSV transformer and write to CSV file
  stringifier.on('readable', async () => {
    let row;
    while ((row = stringifier.read()) !== null) {
      if (!writeStream.write(row)) {
        await once(writeStream, 'drain'); // Handle backpressure
      }
    }
  });

  // Some logging to see what's going on
  discoverer.on('process-collection', (iri: string) =>
    logger.info(`Processing pages in collection "${iri}"`)
  );
  discoverer.on('process-page', (iri: string, dateLastRun?: Date) => {
    const date =
      dateLastRun instanceof Date ? dateLastRun.toISOString() : 'the beginning';
    logger.info(`Processing changes in page "${iri}" changed since ${date}`);
  });
  discoverer.on('only-delete', () =>
    logger.info('Refresh found; only processing delete activities')
  );

  // Map the IIIF change types to basic activity types
  discoverer.on('add', async (iri: string) => writeChange(iri, 'create'));
  discoverer.on('create', async (iri: string) => writeChange(iri, 'create'));
  discoverer.on('update', async (iri: string) => writeChange(iri, 'update'));
  discoverer.on('delete', async (iri: string) => writeChange(iri, 'delete'));
  discoverer.on('remove', async (iri: string) => writeChange(iri, 'delete'));
  discoverer.on('move-delete', async (iri: string) =>
    writeChange(iri, 'delete')
  );
  discoverer.on('move-create', async (iri: string) =>
    writeChange(iri, 'create')
  );

  // Fetch the changes from the remote endpoint
  await discoverer.run();

  stringifier.end();
  writeStream.end();
  await finished(writeStream); // Wait until writing is done

  // TODO: check whether existing files are NOT overwritten and new ones appended
  // Split the CSV file into smaller ones, for queue-based processing
  await splitFileByLines({
    filename: fileWithMetadata,
    numberOfLines: opts.numberOfLinesPerFileWithMetadata,
    outputDir: opts.dirWithQueue,
  });
}
