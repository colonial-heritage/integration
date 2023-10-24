import {
  runOptionsSchema as workerRunOptionsSchema,
  RunOptions as WorkerRunOptions,
} from './dereferencer.js';
import {splitFileByLines} from './splitter.js';
import {getLogger} from '@colonial-collections/common';
import {glob} from 'glob';
import {URL} from 'node:url';
import physicalCpuCount from 'physical-cpu-count-async';
import PrettyMilliseconds from 'pretty-ms';
import {rimraf} from 'rimraf';
import Tinypool from 'tinypool';
import {z} from 'zod';

const runOptionsSchema = z
  .object({
    fileWithMetadata: z.string(),
    dirWithFilesWithMetadata: z.string(),
    numberOfLinesPerFileWithMetadata: z.number(),
  })
  .merge(workerRunOptionsSchema);

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();
  const logger = getLogger();

  // Delete files from a previous run, if any
  await rimraf(opts.dirWithFilesWithMetadata);

  // Split CSV file into smaller chunks, for easier processing
  await splitFileByLines({
    filename: opts.fileWithMetadata,
    numberOfLines: opts.numberOfLinesPerFileWithMetadata,
    outputDir: opts.dirWithFilesWithMetadata,
  });

  // Collect the chunked CSV files (regardless of extension)
  const files = await glob(`${opts.dirWithFilesWithMetadata}/**`, {
    nodir: true,
    absolute: true,
  });

  // "It is better to fork no more child processes than there are physical cores" -
  // https://www.npmjs.com/package/physical-cpu-count-async
  const numberOfThreads = Math.min(physicalCpuCount, files.length);
  logger.info(
    `Processing IRIs in ${files.length} files in "${opts.dirWithFilesWithMetadata}" in ${numberOfThreads} processes (max: ${physicalCpuCount})`
  );

  // Process each CSV file in its own process, in parallel
  const pool = new Tinypool({
    name: 'run',
    runtime: 'child_process', // 'worker_threads' is a little bit slower
    filename: new URL('./dereferencer.js', import.meta.url).href,
    minThreads: numberOfThreads,
  });

  const runs = files.map(file => {
    const runOptions: WorkerRunOptions = {
      fileWithMetadata: file,
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

  // TBD: delete the CSV chunk files?

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Processed changed resources in ${PrettyMilliseconds(runtime)}`);
}
