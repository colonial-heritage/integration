import {fetchMetadataAndWriteToFile} from './writer.js';
import {getLogger} from '@colonial-collections/common';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {ChangeManager} from '@colonial-collections/iiif-change-manager';
import {mkdirp} from 'mkdirp';
import {createWriteStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {dirname} from 'node:path';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  collectionIri: z.string().url(),
  dirWithRuns: z.string(),
  fileWithMetadata: z.string(),
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
  const changeManager = new ChangeManager({dir: opts.dirWithRuns});
  const lastRun = await changeManager.getLastRun();

  const discoverer = new ChangeDiscoverer({
    collectionIri: opts.collectionIri,
    dateLastRun: lastRun !== undefined ? lastRun.startedAt : undefined,
    waitBetweenRequests: opts.waitBetweenRequests,
    credentials: opts.credentials,
  });

  const runStartedAt = new Date();
  await mkdirp(dirname(opts.fileWithMetadata));
  const writeStream = createWriteStream(opts.fileWithMetadata);
  await fetchMetadataAndWriteToFile({discoverer, writeStream});
  const runEndedAt = new Date();

  // Only store the run if at least 1 change has been discovered
  const stats = await stat(opts.fileWithMetadata);
  if (stats.size > 0) {
    await changeManager.saveRun({
      id: 'https://data.colonialcollections.nl/' + Date.now(),
      startedAt: runStartedAt,
      endedAt: runEndedAt,
    });
  }

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(
    `Fetched IRIs of changed resources in ${PrettyMilliseconds(runtime)}`
  );
}
