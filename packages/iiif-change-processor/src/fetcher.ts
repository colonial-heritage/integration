import {fetchMetadataAndWriteToFile} from './writer.js';
import {getLogger} from '@colonial-collections/common';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {ChangeManager} from '@colonial-collections/iiif-change-manager';
import {glob} from 'glob';
import {stat} from 'node:fs/promises';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  collectionIri: z.string().url(),
  fileWithRun: z.string(),
  fileWithMetadata: z.string(),
  dirWithQueue: z.string(),
  numberOfLinesPerFileWithMetadata: z.number(),
  waitBetweenRequests: z.number().min(0).optional(),
  credentials: z
    .object({
      type: z.literal('basic-auth'),
      username: z.string(),
      password: z.string(),
    })
    .optional(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();
  const logger = getLogger();

  // Do not overwrite existing files in the queue - another run is then still ongoing
  const filesInQueue = await glob(`${opts.dirWithQueue}/**`, {nodir: true});
  if (filesInQueue.length > 0) {
    throw new Error(
      `Cannot run: there are ${filesInQueue.length} files in the queue`
    );
  }

  const changeManager = new ChangeManager({path: opts.fileWithRun});
  const lastRun = await changeManager.getRun();

  const discoverer = new ChangeDiscoverer({
    collectionIri: opts.collectionIri,
    dateLastRun: lastRun !== undefined ? lastRun.startedAt : undefined,
    waitBetweenRequests: opts.waitBetweenRequests,
    credentials: opts.credentials,
  });

  const runStartedAt = new Date();

  await fetchMetadataAndWriteToFile({
    discoverer,
    fileWithMetadata: opts.fileWithMetadata,
    dirWithQueue: opts.dirWithQueue,
    numberOfLinesPerFileWithMetadata: opts.numberOfLinesPerFileWithMetadata,
  });

  const runEndedAt = new Date();

  // Only store the run if at least 1 change has been discovered
  const stats = await stat(opts.fileWithMetadata);
  if (stats.size > 0) {
    await changeManager.saveRun({
      id: 'https://data.colonialcollections.nl/' + Date.now(),
      startedAt: runStartedAt,
      endedAt: runEndedAt,
    });

    // TBD: add the metadata as RDF to the run file?
  }

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Finished run in ${PrettyMilliseconds(runtime)}`);
}
