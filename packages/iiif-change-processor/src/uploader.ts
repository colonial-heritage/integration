import {getLogger} from '@colonial-collections/common';
import {TriplyDb} from '@colonial-collections/triplydb';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  triplydbInstanceUrl: z.string(),
  triplydbApiToken: z.string(),
  triplydbAccount: z.string(),
  triplydbDataset: z.string(),
  dirWithResources: z.string(),
  dirTemp: z.string(), // For storing temporary files
  graphName: z.string(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();
  const logger = getLogger();

  const triplyDb = await TriplyDb.new({
    logger,
    instanceUrl: opts.triplydbInstanceUrl,
    apiToken: opts.triplydbApiToken,
    account: opts.triplydbAccount,
    dataset: opts.triplydbDataset,
  });

  await triplyDb.upsertGraphFromDirectory({
    graph: opts.graphName,
    dir: opts.dirWithResources,
    dirTemp: opts.dirTemp,
  });

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Finished run in ${PrettyMilliseconds(runtime)}`);
}
