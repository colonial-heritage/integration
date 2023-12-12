import {deleteObsoleteFiles} from './deleter.js';
import {fetchDataAndWriteToFile} from './generator.js';
import {getLogger} from '@colonial-collections/common';
import {glob} from 'glob';
import {createReadStream} from 'node:fs';
import readline from 'node:readline';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  dirWithResources: z.string(),
  dirWithQueue: z.string(),
  endpointUrl: z.string().url(),
  queryPath: z.string(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();
  const logger = getLogger();

  // Collect the names of queued files (regardless of extension)
  const allFiles = await glob(`${opts.dirWithQueue}/**`, {nodir: true});

  if (allFiles.length === 0) {
    logger.info(`No files found in queue "${opts.dirWithQueue}"`);
    return;
  }

  // Ensure consistent queue processing
  allFiles.sort();

  const iriFile = allFiles[0];

  await deleteObsoleteFiles({
    dirWithResources: opts.dirWithResources,
    iriFile,
  });

  // Read file line by line
  const rl = readline.createInterface({
    input: createReadStream(iriFile),
    crlfDelay: Infinity,
  });

  for await (const iri of rl) {
    await fetchDataAndWriteToFile({
      endpointUrl: opts.endpointUrl,
      queryPath: opts.queryPath,
      iri,
    });
  }

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Finished run in ${PrettyMilliseconds(runtime)}`);
}
