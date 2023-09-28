import {getLogger} from '@colonial-collections/shared';
import {TriplyDb} from '@colonial-collections/triplydb';
import {performance} from 'node:perf_hooks';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const fileSchema = z.object({
  rdfFile: z.string(),
});

const directorySchema = z.object({
  dir: z.string(),
  dirTemp: z.string().optional(), // For storing temporary files
});

const baseSchema = z.object({
  triplydbInstanceUrl: z.string(),
  triplydbApiToken: z.string(),
  triplydbAccount: z.string(),
  triplydbDataset: z.string(),
  triplydbServiceName: z.string(),
  triplydbServiceType: z.string(),
  graphName: z.string(),
});

const fileOrDirectorySchema = z.union([fileSchema, directorySchema]);
const runOptionsSchema = z.intersection(baseSchema, fileOrDirectorySchema);

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

  if (opts.rdfFile) {
    await triplyDb.upsertGraphFromFile({
      graph: opts.graphName,
      file: opts.rdfFile,
    });
  } else {
    await triplyDb.upsertGraphFromDirectory({
      graph: opts.graphName,
      dir: opts.dir,
      dirTemp: opts.dirTemp,
    });
  }

  await triplyDb.restartService({
    name: opts.triplydbServiceName,
    type: opts.triplydbServiceType,
  });

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(`Uploaded in ${PrettyMilliseconds(runtime)}`);
}
