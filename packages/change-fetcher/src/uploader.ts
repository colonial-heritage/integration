import {getLogger} from '@colonial-collections/shared';
import {TriplyDb} from '@colonial-collections/triplydb';
import {glob} from 'glob';
import {unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import PrettyMilliseconds from 'pretty-ms';
import tar from 'tar';
import {z} from 'zod';

const runOptionsSchema = z.object({
  triplydbInstanceUrl: z.string(),
  triplydbApiToken: z.string(),
  triplydbAccount: z.string(),
  triplydbDataset: z.string(),
  dirWithChanges: z.string(),
  dirTemp: z.string(), // For storing temporary files
  graphName: z.string(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = performance.now();
  const logger = getLogger();
  const tarFilename = join(opts.dirTemp, `${Date.now()}.tgz`);

  // Scan for some common RDF file extensions
  const files = await glob(`${opts.dirWithChanges}/**/*.{nt,nq,trig,ttl}`, {
    nodir: true,
  });

  if (files.length === 0) {
    logger.info(`No files found in "${opts.dirWithChanges}" - aborting run`);
    return;
  }

  logger.info(
    `Creating "${tarFilename}" with ${files.length} files from "${opts.dirWithChanges}"`
  );

  const logWarning = (code: string, message: string) =>
    logger.warn(`${message} (code: ${code})`);

  await tar.create({gzip: true, onwarn: logWarning, file: tarFilename}, files);

  const triplyDb = await TriplyDb.new({
    logger,
    instanceUrl: opts.triplydbInstanceUrl,
    apiToken: opts.triplydbApiToken,
    account: opts.triplydbAccount,
    dataset: opts.triplydbDataset,
  });

  await triplyDb.upsertGraphFromFile({
    graph: opts.graphName,
    file: tarFilename,
  });

  try {
    await unlink(tarFilename);
  } catch (err) {
    logger.error(err);
  }

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(
    `Uploaded files in "${opts.dirWithChanges}" in ${PrettyMilliseconds(
      runtime
    )}`
  );
}
