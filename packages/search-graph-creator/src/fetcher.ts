import {shouldDoNewRun} from './checker.js';
import {fetchIrisAndWriteToFile} from './iterator.js';
import {getLogger, splitFileByLines} from '@colonial-collections/common';
import {ChangeManager} from '@colonial-collections/iiif-change-manager';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  fileWithRun: z.string(),
  endpointUrl: z.string().url(),
  datasetId: z.string(),
  queryFile: z.string(),
  iriFile: z.string(),
  numberOfIrisPerRequest: z.number().optional(),
  waitBetweenRequests: z.number().min(0).optional(),
  dirWithQueue: z.string(),
  numberOfLinesPerFileWithIris: z.number(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();
  const logger = getLogger();

  const changeManager = new ChangeManager({path: opts.fileWithRun});
  const lastRun = await changeManager.getRun();

  const shouldRun = await shouldDoNewRun({
    endpointUrl: opts.endpointUrl,
    datasetId: opts.datasetId,
    dateLastRun: lastRun !== undefined ? lastRun.startedAt : undefined,
  });

  if (!shouldRun) {
    logger.info('Dataset has not been changed since the last run');
    return;
  }

  const runStartedAt = new Date();

  await fetchIrisAndWriteToFile({
    endpointUrl: opts.endpointUrl,
    queryFile: opts.queryFile,
    iriFile: opts.iriFile,
    numberOfIrisPerRequest: opts.numberOfIrisPerRequest,
    waitBetweenRequests: opts.waitBetweenRequests,
  });

  // Split the file into smaller ones, for queue-based processing
  await splitFileByLines({
    filename: opts.iriFile,
    numberOfLines: opts.numberOfLinesPerFileWithIris,
    outputDir: opts.dirWithQueue,
  });

  const runEndedAt = new Date();

  await changeManager.saveRun({
    id: 'https://data.colonialcollections.nl/' + Date.now(),
    startedAt: runStartedAt,
    endedAt: runEndedAt,
  });

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Finished run in ${PrettyMilliseconds(runtime)}`);
}
