import {
  runOptionsSchema as workerRunOptionsSchema,
  RunOptions as WorkerRunOptions,
} from './dereferencer.js';
import {getLogger} from '@colonial-collections/common';
import {glob} from 'glob';
import {URL} from 'node:url';
import physicalCpuCount from 'physical-cpu-count-async';
import PrettyMilliseconds from 'pretty-ms';
import Tinypool from 'tinypool';
import {z} from 'zod';

const runOptionsSchema = z
  .object({
    dirWithQueue: z.string(),
    numberOfFilesToProcess: z.number().min(1).optional(), // If undefined, process all files
  })
  .merge(workerRunOptionsSchema.omit({fileWithMetadata: true}));

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();
  const logger = getLogger();

  // Collect the names of queued CSV files (regardless of extension)
  const allFiles = await glob(`${opts.dirWithQueue}/**`, {
    nodir: true,
    absolute: true,
  });

  allFiles.sort(); // Ensure consistent queue processing

  const numberOfFilesToProcess = opts.numberOfFilesToProcess ?? allFiles.length;
  const selectedFiles = allFiles.slice(0, numberOfFilesToProcess);

  // "It is better to fork no more child processes than there are physical cores" -
  // https://www.npmjs.com/package/physical-cpu-count-async
  const numberOfThreads = Math.min(physicalCpuCount, selectedFiles.length);
  logger.info(
    `Processing IRIs in ${selectedFiles.length} files in "${opts.dirWithQueue}" in ${numberOfThreads} processes (max: ${physicalCpuCount})`
  );

  // Process each CSV file in its own process, in parallel
  const pool = new Tinypool({
    name: 'run',
    runtime: 'child_process', // 'worker_threads' is a little bit slower
    filename: new URL('./dereferencer.js', import.meta.url).href,
    minThreads: numberOfThreads,
  });

  const runs = selectedFiles.map(file => {
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

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Finished run in ${PrettyMilliseconds(runtime)}`);
}
