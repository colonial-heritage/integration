import {getLogger} from '@colonial-collections/shared';
import {Iterator} from '@colonial-collections/file-iterator';
import {readFile} from 'node:fs/promises';
import {mkdirp} from 'mkdirp';
import {createWriteStream} from 'node:fs';
import {dirname} from 'node:path';
import {performance} from 'node:perf_hooks';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  inputDir: z.string(),
  queryFile: z.string(),
  iriFile: z.string(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = performance.now();

  const logger = getLogger();
  logger.info(`Collecting IRIs from files in "${opts.inputDir}"`);

  await mkdirp(dirname(opts.iriFile));
  const writeStream = createWriteStream(opts.iriFile);
  const query = await readFile(opts.queryFile, {encoding: 'utf-8'});

  const iterator = new Iterator({
    dir: opts.inputDir,
    query,
    writeStream,
  });

  iterator.on('error', (err: Error) => logger.error(err));
  iterator.on('collected-iris', (numberOfIris: number, filename: string) => {
    logger.info(`Collected ${numberOfIris} IRIs from "${filename}"`);
  });

  await iterator.untilDone();

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(`Collected IRIs in ${PrettyMilliseconds(runtime)}`);
}
