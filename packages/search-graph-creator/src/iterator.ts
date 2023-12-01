import {getLogger} from '@colonial-collections/common';
import {Iterator} from '@colonial-collections/sparql-iterator';
import {readFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {z} from 'zod';

const optionsSchema = z.object({
  endpointUrl: z.string().url(),
  queryFile: z.string(),
  iriFile: z.string(),
  numberOfIrisPerRequest: z.number().optional(),
  waitBetweenRequests: z.number().min(0).optional(),
});

export type Options = z.infer<typeof optionsSchema>;

export async function fetchIrisAndWriteToFile(options: Options) {
  const opts = optionsSchema.parse(options);

  const logger = getLogger();
  logger.info(`Collecting IRIs from SPARQL endpoint "${opts.endpointUrl}"`);

  await mkdir(dirname(opts.iriFile), {recursive: true});
  const writeStream = createWriteStream(opts.iriFile);
  const query = await readFile(opts.queryFile, 'utf-8');

  const iterator = new Iterator({
    endpointUrl: opts.endpointUrl,
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
}
