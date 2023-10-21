import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {stringify} from 'csv';
import {once} from 'node:events';
import {WriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {pino} from 'pino';
import {z} from 'zod';

const constructorOptionsSchema = z.object({
  logger: z.any(),
  discoverer: z.instanceof(ChangeDiscoverer),
  writeStream: z.instanceof(WriteStream),
});

export type ConstructorOptions = z.input<typeof constructorOptionsSchema>;

export class ChangeWriter {
  private logger: pino.Logger;
  private discoverer: ChangeDiscoverer;
  private writeStream: WriteStream;

  constructor(options: ConstructorOptions) {
    const opts = constructorOptionsSchema.parse(options);

    this.logger = opts.logger;
    this.discoverer = opts.discoverer;
    this.writeStream = opts.writeStream;
  }

  async run() {
    const stringifier = stringify({
      columns: ['iri', 'action'],
      header: true,
    });
    stringifier.on('error', (err: Error) => this.logger.error(err));
    stringifier.on('readable', async () => {
      let row;
      while ((row = stringifier.read()) !== null) {
        if (!this.writeStream.write(row)) {
          await once(this.writeStream, 'drain'); // Handle backpressure
        }
      }
    });

    this.discoverer.on('process-collection', (iri: string) =>
      this.logger.info(`Processing pages in collection "${iri}"`)
    );
    this.discoverer.on('process-page', (iri: string, dateLastRun?: Date) => {
      const date =
        dateLastRun instanceof Date
          ? dateLastRun.toISOString()
          : 'the beginning';
      this.logger.info(
        `Processing changes in page "${iri}" changed since ${date}`
      );
    });
    this.discoverer.on('only-delete', () =>
      this.logger.info('Refresh found; only processing delete activities')
    );

    const writeChange = async (iri: string, action: string) => {
      if (!stringifier.write([iri, action])) {
        await once(stringifier, 'drain'); // Handle backpressure
      }
    };

    this.discoverer.on('add', async (iri: string) =>
      writeChange(iri, 'upsert')
    );
    this.discoverer.on('create', async (iri: string) =>
      writeChange(iri, 'upsert')
    );
    this.discoverer.on('update', async (iri: string) =>
      writeChange(iri, 'upsert')
    );
    this.discoverer.on('delete', async (iri: string) =>
      writeChange(iri, 'delete')
    );
    this.discoverer.on('remove', async (iri: string) =>
      writeChange(iri, 'delete')
    );
    this.discoverer.on('move-delete', async (iri: string) =>
      writeChange(iri, 'delete')
    );
    this.discoverer.on('move-create', async (iri: string) =>
      writeChange(iri, 'upsert')
    );

    await this.discoverer.run();

    stringifier.end();
    this.writeStream.end();
    await finished(this.writeStream); // Wait until writing is done
  }
}
