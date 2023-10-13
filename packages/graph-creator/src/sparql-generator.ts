import {getLogger} from '@colonial-collections/common';
import {Generator} from '@colonial-collections/sparql-generator';
import {getNumberOfLinesInFile, readQueries} from './helpers.js';
import {mkdirp} from 'mkdirp';
import {createReadStream, createWriteStream} from 'node:fs';
import {dirname} from 'node:path';
import {performance} from 'node:perf_hooks';
import readline from 'node:readline';
import PrettyMilliseconds from 'pretty-ms';
import {z} from 'zod';

const runOptionsSchema = z.object({
  endpointUrl: z.string().url(),
  queryPath: z.string(),
  iriFile: z.string(),
  numberOfResourcesPerRequest: z.number().min(1).default(1),
  waitBetweenRequests: z.number().min(0).optional(),
  numberOfConcurrentRequests: z.number().min(1).optional(),
  rdfFile: z.string(),
});

export type RunOptions = z.input<typeof runOptionsSchema>;

export async function run(options: RunOptions) {
  const opts = runOptionsSchema.parse(options);

  const startTime = performance.now();
  const logger = getLogger();
  const queries = await readQueries(opts.queryPath);
  await mkdirp(dirname(opts.rdfFile));
  const writeStream = createWriteStream(opts.rdfFile);

  const generator = new Generator({
    endpointUrl: opts.endpointUrl,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
    waitBetweenRequests: opts.waitBetweenRequests,
    queries,
    writeStream,
  });

  // Counts are helpful - not required - to display progress in the logs
  let numberOfProcessedResources = 0;
  let prevProgressPercentage = -1;
  const totalNumberOfResources = await getNumberOfLinesInFile(opts.iriFile);
  logger.info(
    `Generating resources based on ${totalNumberOfResources} IRIs in "${opts.iriFile}"`
  );

  // TBD: write the IRIs that couldn't be processed to a separate stream ('uitvallijst')?
  generator.on('error', (err: Error) => logger.error(err));

  // Log messages for progress monitoring
  generator.on('generate-end', (iris: string[]) => {
    if (totalNumberOfResources === 0) {
      return; // No progress to log
    }

    // If e.g. 5 queries are in use for generating a resource for 1 IRI,
    // then the progress per generation is (1 / 5 =) 0.2%
    numberOfProcessedResources += iris.length / queries.length;
    const currentProgressPercentage = Math.round(
      (numberOfProcessedResources / totalNumberOfResources) * 100
    );

    // Only log a given percentage once, to not overflow the logs
    if (prevProgressPercentage === currentProgressPercentage) {
      return;
    }

    const intermediateTime = performance.now();
    const runtime = intermediateTime - startTime;
    logger.info(
      `Generated ${currentProgressPercentage}% of ${totalNumberOfResources} resources (runtime: ${PrettyMilliseconds(
        runtime
      )})`
    );
    prevProgressPercentage = currentProgressPercentage;
  });

  // Read file line by line
  const rl = readline.createInterface({
    input: createReadStream(opts.iriFile),
    crlfDelay: Infinity,
  });

  const process = async (iriBatch: string[]) => {
    const iris = iriBatch.slice(); // Clone
    iris && (await generator.generate(iris));
  };

  // Optionally process the IRIs in batches, not individually, to improve performance
  const iriBatch: string[] = [];
  for await (const iri of rl) {
    iriBatch.push(iri);
    if (iriBatch.length === opts.numberOfResourcesPerRequest) {
      await process(iriBatch);
      iriBatch.length = 0; // Reset for new batch
    }
  }

  // Process the remaining IRIs, if any, that weren't part of a batch
  await process(iriBatch);

  await generator.untilDone();

  const finishTime = performance.now();
  const runtime = finishTime - startTime;
  logger.info(`Done generating resources in ${PrettyMilliseconds(runtime)}`);
}
