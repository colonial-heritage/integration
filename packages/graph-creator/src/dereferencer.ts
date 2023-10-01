import {getLogger} from '@colonial-collections/common';
import {FileStorer} from '@colonial-collections/file-storer';
import {createReadStream} from 'node:fs';
import {performance} from 'node:perf_hooks';
import readline from 'node:readline';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  iriFile: z.string(),
  waitBetweenRequests: z.number().min(0).optional(),
  numberOfConcurrentRequests: z.number().min(1).optional(),
  outputDir: z.string(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = performance.now();

  const logger = getLogger();
  logger.info(`Dereferencing IRIs from "${opts.iriFile}"`);

  const storer = new FileStorer({
    dir: opts.outputDir,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
  });

  storer.on('error', (err: Error) => logger.error(err));
  storer.on('upsert', (iri: string, filename: string) =>
    logger.info(`Stored "${filename}" for "${iri}"`)
  );

  // Read file line by line
  const rl = readline.createInterface({
    input: createReadStream(opts.iriFile),
    crlfDelay: Infinity,
  });

  for await (const iri of rl) {
    await storer.save({iri, type: 'upsert'});
  }

  await storer.untilDone();

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(`Dereferenced IRIs in ${PrettyMilliseconds(runtime)}`);
}
