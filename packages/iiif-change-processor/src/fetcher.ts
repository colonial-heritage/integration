import {getLogger} from '@colonial-collections/common';
import {FileStorer} from '@colonial-collections/file-storer';
import {ChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {ChangeManager} from '@colonial-collections/iiif-change-manager';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  collectionIri: z.string().url(),
  dirWithRuns: z.string(),
  dirWithChanges: z.string(),
  waitBetweenRequests: z.number().min(0).optional(),
  numberOfConcurrentRequests: z.number().min(1).optional(),
  credentials: z
    .object({
      type: z.literal('basic-auth'),
      username: z.string(),
      password: z.string(),
    })
    .optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();

  const changeManager = new ChangeManager({dir: opts.dirWithRuns});
  const lastRun = await changeManager.getLastRun();
  const logger = getLogger();

  const storer = new FileStorer({
    dir: opts.dirWithChanges,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
    credentials: opts.credentials,
    headers: opts.headers,
  });

  storer.on('upsert', (iri: string, filename: string) =>
    logger.info(`Created or updated "${filename}" for "${iri}"`)
  );
  storer.on('delete', (iri: string, filename: string) =>
    logger.info(`Deleted "${filename}" for "${iri}"`)
  );
  storer.on('error', (err: Error) => logger.error(err));

  const discoverer = new ChangeDiscoverer({
    collectionIri: opts.collectionIri,
    dateLastRun: lastRun !== undefined ? lastRun.startedAt : undefined,
    waitBetweenRequests: opts.waitBetweenRequests,
    credentials: opts.credentials,
  });

  discoverer.on('process-collection', (iri: string) => {
    logger.info(`Processing pages in collection "${iri}"`);
  });
  discoverer.on('process-page', (iri: string, dateLastRun?: Date) => {
    const date =
      dateLastRun instanceof Date ? dateLastRun.toISOString() : 'the beginning';
    logger.info(`Processing changes in page "${iri}" changed since ${date}`);
  });
  discoverer.on('only-delete', () =>
    logger.info('Refresh found; only processing delete activities')
  );

  let discoveredChange = false;

  const upsertChange = async (iri: string) => {
    discoveredChange = true;
    storer.save({iri, type: 'upsert'});
  };
  const deleteChange = async (iri: string) => {
    discoveredChange = true;
    storer.save({iri, type: 'delete'});
  };

  discoverer.on('add', upsertChange);
  discoverer.on('create', upsertChange);
  discoverer.on('update', upsertChange);
  discoverer.on('delete', deleteChange);
  discoverer.on('remove', deleteChange);
  discoverer.on('move-delete', deleteChange);
  discoverer.on('move-create', upsertChange);

  const runStartedAt = new Date();
  await discoverer.run();
  const runEndedAt = new Date();
  await storer.untilDone();

  // Only store the run if at least 1 change has been discovered
  if (discoveredChange) {
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
