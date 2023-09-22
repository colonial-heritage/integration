#!/bin/env node

import {cac} from 'cac';
import type {RunOptions as DiscoverRunOptions} from './discoverer.js';
import type {RunOptions as UploadRunOptions} from './uploader.js';

const cli = cac();

cli
  .command('discover', 'Discover, fetch and store changes')
  .option('--collection-iri <string>', 'Collection IRI')
  .option('--dir <string>', 'Directory for storing the runs and changes')
  .option(
    '--wait-between-requests [number]',
    'Wait between requests, in milliseconds',
    {
      default: 500,
    }
  )
  .option(
    '--number-of-concurrent-requests [number]',
    'Number of concurrent requests',
    {
      default: 1,
    }
  )
  .action(async (options: DiscoverRunOptions) => {
    import('./discoverer.js').then(action => action.run(options));
  });

cli
  .command('upload', 'Upload changes to the RDF store')
  .option('--triplydb-instance-url <string>', 'TriplyDB instance URL')
  .option('--triplydb-api-token <string>', 'TriplyDB API token')
  .option('--triplydb-account <string>', 'TriplyDB account')
  .option('--triplydb-dataset <string>', 'TriplyDB dataset')
  .option('--dir <string>', 'Directory containing the RDF files to upload')
  .option(
    '--graph-name <string>',
    'Name of the graph to upload the RDF files to'
  )
  .action(async (options: UploadRunOptions) => {
    import('./uploader.js').then(action => action.run(options));
  });

cli.help();
cli.parse();
