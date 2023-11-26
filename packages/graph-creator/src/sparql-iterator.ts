import {getLogger} from '@colonial-collections/common';
import {Iterator} from '@colonial-collections/sparql-iterator';
import {readFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {performance} from 'node:perf_hooks';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  endpointUrl: z.string().url(),
  endpointMethod: z.string().optional(),
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

  await mkdir(dirname(opts.iriFile), {recursive: true});
  const writeStream = createWriteStream(opts.iriFile);
  const query = await readFile(opts.queryFile, 'utf-8');

  const iterator = new Iterator({
    endpointUrl: opts.endpointUrl,
    endpointMethod: opts.endpointMethod,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfIrisPerRequest: opts.numberOfIrisPerRequest,
    query,
    writeStream,
  });

  iterator.on('error', (err: Error) => logger.error(err));
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

  await iterator.untilDone();

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(`Collected IRIs in ${PrettyMilliseconds(runtime)}`);
}
