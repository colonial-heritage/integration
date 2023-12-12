import {getLogger, md5} from '@colonial-collections/common';
import {Generator} from '@colonial-collections/sparql-generator';
import {readQueries} from './helpers.js';
import {createWriteStream} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {z} from 'zod';

const optionsSchema = z.object({
  endpointUrl: z.string().url(),
  queryPath: z.string(),
  iri: z.string(),
});

export type Options = z.input<typeof optionsSchema>;

export async function fetchDataAndWriteToFile(options: Options) {
  const opts = optionsSchema.parse(options);

  const logger = getLogger();
  const queries = await readQueries(opts.queryPath); // TODO: read query only once - move to processor.ts

  // TODO: write in a dir structure (put in separate file with file system operations?)
  const rdfFile = `${md5(opts.iri)}.nt`;
  await mkdir(dirname(rdfFile), {recursive: true});
  const writeStream = createWriteStream(rdfFile);

  const generator = new Generator({
    endpointUrl: opts.endpointUrl,
    numberOfConcurrentRequests: 1,
    queries,
    writeStream,
  });

  // TBD: write the IRIs that couldn't be processed to a separate stream ('uitvallijst')?
  generator.on('error', (err: Error) => logger.error(err));

  await generator.generate([opts.iri]);

  await generator.untilDone();
}
