import {getLogger} from '@colonial-collections/shared';
import {Iterator} from '@colonial-collections/sparql-iterator';
import {readFileAsString} from './helpers.js';
import {mkdirp} from 'mkdirp';
import {createWriteStream} from 'node:fs';
import {dirname} from 'node:path';
import {performance} from 'node:perf_hooks';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  endpointUrl: z.string().url(),
  queryFile: z.string(),
  iriFile: z.string(),
  numberOfIrisPerRequest: z.number().optional(),
  waitBetweenRequests: z.number().min(0).optional(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = performance.now();

  const logger = getLogger();
  logger.info(`Collecting IRIs from SPARQL endpoint "${opts.endpointUrl}"`);

  await mkdirp(dirname(opts.iriFile));
  const writeStream = createWriteStream(opts.iriFile);
  const query = await readFileAsString(opts.queryFile);

  const iterator = new Iterator({
    endpointUrl: opts.endpointUrl,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfIrisPerRequest: opts.numberOfIrisPerRequest,
    query,
    writeStream,
  });

  iterator.on(
    'collected-iris',
    (numberOfIris: number, limit: number, offset: number) => {
      logger.info(
        `Collected ${numberOfIris} IRIs from offset ${offset} to ${
          offset + numberOfIris
        }`
      );
    }
  );

  iterator.on('error', (err: Error) => logger.error(err));

  await iterator.untilDone();

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(`Collected IRIs in ${PrettyMilliseconds(runtime)}`);
}
