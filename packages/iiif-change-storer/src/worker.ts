import {getLogger} from '@colonial-collections/common';
import {FileStorer} from '@colonial-collections/file-storer';
import {parse} from 'csv';
import {createReadStream} from 'fs';
import {z} from 'zod';

export const runOptionsSchema = z.object({
  fileWithIris: z.string(),
  dirWithChanges: z.string(),
  waitBetweenRequests: z.number().min(0).optional(),
  numberOfConcurrentRequests: z.number().min(1).optional(),
  credentials: z
    .object({
      type: z.literal('basic-auth'),
      username: z.string(),
      password: z.string(),
    })
    .optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const logger = getLogger();

  const storer = new FileStorer({
    dir: opts.dirWithChanges,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
    credentials: opts.credentials,
    headers: opts.headers,
  });

  storer.on('upsert', (iri: string, filename: string) =>
    logger.info(`Created or updated "${filename}" for "${iri}"`)
  );
  storer.on('delete', (iri: string, filename: string) =>
    logger.info(`Deleted "${filename}" for "${iri}"`)
  );
  storer.on('error', (err: Error) => logger.error(err));

  const parser = createReadStream(opts.fileWithIris).pipe(
    parse({
      columns: true,
      delimiter: ',',
    })
  );

  for await (const record of parser) {
    await storer.save({iri: record.iri, type: record.action});
  }

  await storer.untilDone();
}
