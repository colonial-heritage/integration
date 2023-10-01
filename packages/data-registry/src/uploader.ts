import {getLogger} from '@colonial-collections/common';
import {TriplyDb} from '@colonial-collections/triplydb';
import {getFilesAndGraphs} from './files.js';
import {performance} from 'node:perf_hooks';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const graphBaseIri = 'https://data.colonialcollections.nl/';

const runOptionsSchema = z.object({
  triplydbInstanceUrl: z.string(),
  triplydbApiToken: z.string(),
  triplydbAccount: z.string(),
  triplydbDataset: z.string(),
  triplydbServiceName: z.string(),
  triplydbServiceType: z.string(),
  filePattern: z.string(), // E.g. 'data/testing/**/*.ttl'
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

  const filesAndGraphs = await getFilesAndGraphs({
    filePattern: opts.filePattern,
    graphBaseIri,
  });

  for (const fileAndGraph of filesAndGraphs) {
    await triplyDb.upsertGraphFromFile({
      graph: fileAndGraph.graph,
      file: fileAndGraph.file,
    });
  }

  // Only restart if files have been uploaded
  if (filesAndGraphs.length > 0) {
    await triplyDb.restartService({
      name: opts.triplydbServiceName,
      type: opts.triplydbServiceType,
    });
  }

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(
    `Processed ${filesAndGraphs.length} files in ${PrettyMilliseconds(runtime)}`
  );
}
