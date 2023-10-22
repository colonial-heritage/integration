import {
  runOptionsSchema as workerRunOptionsSchema,
  RunOptions as WorkerRunOptions,
} from './dereferencer.js';
import {getLogger} from '@colonial-collections/common';
import {glob} from 'glob';
import {URL} from 'node:url';
import PrettyMilliseconds from 'pretty-ms';
import Tinypool from 'tinypool';
import {z} from 'zod';

const runOptionsSchema = z
  .object({
    dirWithFiles: z.string(),
  })
  .merge(workerRunOptionsSchema.omit({fileWithChanges: true}));

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const logger = getLogger();
  const startTime = Date.now();

  // Collect the CSV files
  const files = await glob(`${opts.dirWithFiles}/**/*.csv`, {
    nodir: true,
    absolute: true,
  });

  logger.info(
    `Processing IRIs in ${files.length} files in "${opts.dirWithFiles}"`
  );

  // Process each CSV file in its own process, in parallel
  const pool = new Tinypool({
    name: 'run',
    runtime: 'child_process',
    filename: new URL('./dereferencer.js', import.meta.url).href,
    maxQueue: 'auto',
    minThreads: files.length, // One thread per file
  });

  const runs = files.map(file => {
    const runOptions: WorkerRunOptions = {
      fileWithChanges: file,
      dirWithChanges: opts.dirWithChanges,
      waitBetweenRequests: opts.waitBetweenRequests,
      numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
      credentials: opts.credentials,
      headers: opts.headers,
    };

    try {
      return pool.run(runOptions);
    } catch (err) {
      logger.error(err);
      return; // Satisfy TS compiler
    }
  });

  await Promise.all(runs);

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Processed changed resources in ${PrettyMilliseconds(runtime)}`);
}
