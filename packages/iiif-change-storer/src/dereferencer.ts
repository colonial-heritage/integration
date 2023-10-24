import {getLogger, getNumberOfLinesInFile} from '@colonial-collections/common';
import {FileStorer} from '@colonial-collections/file-storer';
import {parse} from 'csv';
import {createReadStream} from 'node:fs';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

export const runOptionsSchema = z.object({
  fileWithMetadata: z.string(),
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

  const startTime = Date.now();
  const logger = getLogger();

  const totalNumberOfIris = await getNumberOfLinesInFile(opts.fileWithMetadata);
  logger.info(
    `Processing ${totalNumberOfIris} IRIs in "${opts.fileWithMetadata}"`
  );

  // Display progress in the logs
  let numberOfProcessedIris = 0;
  let prevProgressPercentage = -1;

  const logProgress = () => {
    numberOfProcessedIris++;
    const currentProgressPercentage = Math.round(
      (numberOfProcessedIris / totalNumberOfIris) * 100
    );

    // Only log a given percentage once, to not overflow the logs
    if (prevProgressPercentage === currentProgressPercentage) {
      return;
    }

    const intermediateTime = Date.now();
    const runtime = intermediateTime - startTime;
    logger.info(
      `Processed ${currentProgressPercentage}% of ${totalNumberOfIris} IRIs in "${
        opts.fileWithMetadata
      }" (runtime: ${PrettyMilliseconds(runtime)})`
    );

    prevProgressPercentage = currentProgressPercentage;
  };

  const storer = new FileStorer({
    dir: opts.dirWithChanges,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
    credentials: opts.credentials,
    headers: opts.headers,
  });

  // Some logging to see what's going on
  storer.on('upsert', logProgress);
  storer.on('delete', logProgress);
  storer.on('error', (err: Error) => logger.error(err));

  // Parse and stream the CSV file, row by row
  const parser = createReadStream(opts.fileWithMetadata).pipe(parse());

  for await (const row of parser) {
    const activity = rowSchema.parse(row);
    await storer.save({iri: activity[0], type: activity[1]});
  }

  // Wait until all resources have been stored
  await storer.untilDone();
}
