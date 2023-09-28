import {ChangeRunManager} from '@colonial-collections/change-run-manager';
import {IiifChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {RdfFileStore} from '@colonial-collections/rdf-file-store';
import {getLogger} from '@colonial-collections/shared';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  collectionIri: z.string().url(),
  dirWithRuns: z.string(),
  dirWithChanges: z.string(),
  waitBetweenRequests: z.number().min(0).optional(),
  numberOfConcurrentRequests: z.number().min(1).optional(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();

  const changeRunManager = new ChangeRunManager({dir: opts.dirWithRuns});
  const lastRun = await changeRunManager.getLastRun();
  const logger = getLogger();

  const store = new RdfFileStore({
    dir: opts.dirWithChanges,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
  });

  store.on('upsert', (iri: string, filename: string) =>
    logger.info(`Created or updated "${filename}" for "${iri}"`)
  );
  store.on('delete', (iri: string, filename: string) =>
    logger.info(`Deleted "${filename}" for "${iri}"`)
  );
  store.on('error', (err: Error) => logger.error(err));

  const discoverer = new IiifChangeDiscoverer({
    collectionIri: opts.collectionIri,
    dateLastRun: lastRun !== undefined ? lastRun.startedAt : undefined,
    waitBetweenRequests: opts.waitBetweenRequests,
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
    store.save({iri, type: 'upsert'});
  };
  const deleteChange = async (iri: string) => {
    discoveredChange = true;
    store.save({iri, type: 'delete'});
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
  await store.untilDone();

  // Only store the run if at least 1 change has been discovered
  if (discoveredChange) {
    await changeRunManager.saveRun({
      id: 'https://data.colonialcollections.nl/' + Date.now(),
      startedAt: runStartedAt,
      endedAt: runEndedAt,
    });
  }

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Processed changes in ${PrettyMilliseconds(runtime)}`);
}