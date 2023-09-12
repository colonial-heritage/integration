import {getLogger} from '@colonial-collections/shared';
import {TriplyDb} from '@colonial-collections/triplydb';
import {performance} from 'node:perf_hooks';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  triplydbInstanceUrl: z.string(),
  triplydbApiToken: z.string(),
  triplydbAccount: z.string(),
  triplydbDataset: z.string(),
  triplydbServiceName: z.string(),
  triplydbServiceType: z.string(),
  rdfFile: z.string(),
  graphName: z.string(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = performance.now();
  const logger = getLogger();

  const triplyDb = await TriplyDb.new({
    logger,
    instanceUrl: opts.triplydbInstanceUrl,
    apiToken: opts.triplydbApiToken,
    account: opts.triplydbAccount,
    dataset: opts.triplydbDataset,
  });

  await triplyDb.upsertGraphFromRdfFile({
    graph: opts.graphName,
    file: opts.rdfFile,
  });

  await triplyDb.restartService({
    name: opts.triplydbServiceName,
    type: opts.triplydbServiceType,
  });

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(`Uploaded "${opts.rdfFile}" in ${PrettyMilliseconds(runtime)}`);
}