import {fetchChangesAndWriteToFile} from './writer.js';
import {getLogger} from '@colonial-collections/common';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {ChangeManager} from '@colonial-collections/iiif-change-manager';
import {createWriteStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  collectionIri: z.string().url(),
  dirWithRuns: z.string(),
  fileWithChanges: z.string(),
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

  const changeManager = new ChangeManager({dir: opts.dirWithRuns});
  const lastRun = await changeManager.getLastRun();
  const logger = getLogger();

  const discoverer = new ChangeDiscoverer({
    collectionIri: opts.collectionIri,
    dateLastRun: lastRun !== undefined ? lastRun.startedAt : undefined,
    waitBetweenRequests: opts.waitBetweenRequests,
    credentials: opts.credentials,
  });

  const runStartedAt = new Date();
  const writeStream = createWriteStream(opts.fileWithChanges);
  await fetchChangesAndWriteToFile({discoverer, writeStream});
  const runEndedAt = new Date();

  // Only store the run if at least 1 change has been discovered
  const stats = await stat(opts.fileWithChanges);
  if (stats.size > 0) {
    await changeManager.saveRun({
      id: 'https://data.colonialcollections.nl/' + Date.now(),
      startedAt: runStartedAt,
      endedAt: runEndedAt,
    });
  }

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Processed changes in ${PrettyMilliseconds(runtime)}`);
}
