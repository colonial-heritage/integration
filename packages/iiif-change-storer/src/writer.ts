import {getLogger} from '@colonial-collections/common';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {stringify} from 'csv';
import {once} from 'node:events';
import {WriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {z} from 'zod';

const runOptionsSchema = z.object({
  discoverer: z.instanceof(ChangeDiscoverer),
  writeStream: z.instanceof(WriteStream),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const {discoverer, writeStream} = opts;
  const logger = getLogger();

  // Write changes to CSV file
  const stringifier = stringify({
    // columns: ['iri', 'action'],
    // header: true,
  });
  stringifier.on('error', (err: Error) => logger.error(err));
  stringifier.on('readable', async () => {
    let row;
    while ((row = stringifier.read()) !== null) {
      if (!writeStream.write(row)) {
        await once(writeStream, 'drain'); // Handle backpressure
      }
    }
  });

  const writeChange = async (iri: string, action: string) => {
    if (!stringifier.write([iri, action])) {
      await once(stringifier, 'drain'); // Handle backpressure
    }
  };

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

  discoverer.on('add', async (iri: string) => writeChange(iri, 'upsert'));
  discoverer.on('create', async (iri: string) => writeChange(iri, 'upsert'));
  discoverer.on('update', async (iri: string) => writeChange(iri, 'upsert'));
  discoverer.on('delete', async (iri: string) => writeChange(iri, 'delete'));
  discoverer.on('remove', async (iri: string) => writeChange(iri, 'delete'));
  discoverer.on('move-delete', async (iri: string) =>
    writeChange(iri, 'delete')
  );
  discoverer.on('move-create', async (iri: string) =>
    writeChange(iri, 'upsert')
  );

  await discoverer.run();

  stringifier.end();
  writeStream.end();
  await finished(writeStream); // Wait until writing is done
}
