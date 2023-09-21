import {getLogger} from '@colonial-collections/shared';
import {TriplyDb} from '@colonial-collections/triplydb';
import {unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
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
  dir: z.string(),
  graphName: z.string(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = performance.now();
  const logger = getLogger();
  const tarFilename = join(tmpdir(), `${Date.now()}.tgz`);

  const triplyDb = await TriplyDb.new({
    logger,
    instanceUrl: opts.triplydbInstanceUrl,
    apiToken: opts.triplydbApiToken,
    account: opts.triplydbAccount,
    dataset: opts.triplydbDataset,
  });

  const logWarning = (code: string, message: string) =>
    logger.warn(`${message} (code: ${code})`);

  await tar.create({gzip: true, onwarn: logWarning, file: tarFilename}, [
    opts.dir,
  ]);

  await triplyDb.upsertGraphFromRdfFile({
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
    `Uploaded files in "${opts.dir}" in ${PrettyMilliseconds(runtime)}`
  );
}
