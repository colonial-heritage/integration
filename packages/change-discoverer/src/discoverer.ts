import {ChangeRunManager, Run} from '@colonial-collections/change-run-manager';
import {IiifChangeDiscoverer} from '@colonial-collections/iiif-change-discoverer';
import {RdfFileStore} from '@colonial-collections/rdf-file-store';
import {getLogger} from '@colonial-collections/shared';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';
import {join} from 'path';

const runOptionsSchema = z.object({
  collectionIri: z.string().url(),
  dir: z.string(),
  waitBetweenRequests: z.number().min(0).optional(),
  numberOfConcurrentRequests: z.number().min(1).optional(),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = Date.now();

  const dirWithRuns = join(opts.dir, 'runs');
  const changeRunManager = new ChangeRunManager({dir: dirWithRuns});
  const lastRun = await changeRunManager.getLastRun();
  const logger = getLogger();

  const dirWithChanges = join(opts.dir, 'changes');
  const store = new RdfFileStore({
    dir: dirWithChanges,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
  });

  store.on('upsert', (iri: string, filename: string) =>
    logger.info(`Created or updated ${filename} for ${iri}`)
  );
  store.on('delete', (iri: string, filename: string) =>
    logger.info(`Deleted ${filename} for ${iri}`)
  );
  store.on('error', (err: Error) => logger.error(err));

  const discoverer = new IiifChangeDiscoverer({
    collectionIri: opts.collectionIri,
    dateLastRun: lastRun !== undefined ? lastRun.endedAt : undefined,
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
  discoverer.on('add', async iri => store.save({iri, type: 'upsert'}));
  discoverer.on('create', async iri => store.save({iri, type: 'upsert'}));
  discoverer.on('update', async iri => store.save({iri, type: 'upsert'}));
  discoverer.on('delete', async iri => store.save({iri, type: 'delete'}));
  discoverer.on('remove', async iri => store.save({iri, type: 'delete'}));
  discoverer.on('move-delete', async iri => store.save({iri, type: 'delete'}));
  discoverer.on('move-create', async iri => store.save({iri, type: 'upsert'}));
  discoverer.on('only-delete', () =>
    logger.info('Refresh found; only processing delete activities')
  );

  const runStartedAt = new Date();
  await discoverer.run();
  const runEndedAt = new Date();
  await store.untilDone();

  // TBD: only store the run if at least 1 object has been changed?
  const currentRun: Run = {
    id: 'http://example.org/' + Date.now(),
    startedAt: runStartedAt,
    endedAt: runEndedAt,
  };

  await changeRunManager.saveRun(currentRun);

  const finishTime = Date.now();
  const runtime = finishTime - startTime;
  logger.info(`Processed changes in ${PrettyMilliseconds(runtime)}`);
}
