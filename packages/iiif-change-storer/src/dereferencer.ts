import {getLogger} from '@colonial-collections/common';
import {FileStorer} from '@colonial-collections/file-storer';
import {parse} from 'csv';
import {createReadStream} from 'fs';
import {z} from 'zod';

export const runOptionsSchema = z.object({
  fileWithMetadataOfChanges: z.string(),
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

const rowSchema = z.tuple([
  z.string(),
  z.enum(['create', 'delete', 'update']).transform(type => {
    if (type === 'create') return 'upsert';
    if (type === 'delete') return 'delete';
    if (type === 'update') return 'upsert';
    return z.NEVER; // Satisfy TS compiler; not reached
  }),
]);

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const logger = getLogger();
  logger.info(`Processing IRIs in "${opts.fileWithMetadataOfChanges}"`);

  const storer = new FileStorer({
    dir: opts.dirWithChanges,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
    credentials: opts.credentials,
    headers: opts.headers,
  });

  // Some logging to see what's going on
  storer.on('upsert', (iri: string, filename: string) =>
    logger.info(`Created or updated "${filename}" for "${iri}"`)
  );
  storer.on('delete', (iri: string, filename: string) =>
    logger.info(`Deleted "${filename}" for "${iri}"`)
  );
  storer.on('error', (err: Error) => logger.error(err));

  // Parse and stream the CSV file, row by row
  const parser = createReadStream(opts.fileWithMetadataOfChanges).pipe(parse());

  for await (const row of parser) {
    const activity = rowSchema.parse(row);
    await storer.save({iri: activity[0], type: activity[1]});
  }

  // Wait until all resources in the CSV files have been dereferenced
  await storer.untilDone();
}
