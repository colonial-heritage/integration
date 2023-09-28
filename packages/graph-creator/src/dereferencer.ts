import {getLogger} from '@colonial-collections/shared';
import {RdfFileStore} from '@colonial-collections/rdf-file-store';
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

  const store = new RdfFileStore({
    dir: opts.outputDir,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
  });

  store.on('error', (err: Error) => logger.error(err));
  store.on('upsert', (iri: string, filename: string) =>
    logger.info(`Stored "${filename}" for "${iri}"`)
  );

  // Read file line by line
  const rl = readline.createInterface({
    input: createReadStream(opts.iriFile),
    crlfDelay: Infinity,
  });

  for await (const iri of rl) {
    store.save({iri, type: 'upsert'});
  }

  await store.untilDone();

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(`Dereferenced IRIs in ${PrettyMilliseconds(runtime)}`);
}
