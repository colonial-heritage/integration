#!/bin/env node

import {cac} from 'cac';
import type {RunOptions as FetchRunOptions} from './fetcher.js';
import type {RunOptions as ProcessRunOptions} from './processor.js';

const cli = cac();

cli
  .command('fetch', 'Fetch IRIs of changed resources')
  .option('--collection-iri <string>', 'Collection IRI')
  .option('--dir-with-runs <string>', 'Directory for storing the runs')
  .option(
    '--file-with-metadata <string>',
    'CSV file for storing the metadata of changed resources'
  )
  .option(
    '--wait-between-requests [number]',
    'Wait between requests, in milliseconds',
    {
      default: 0,
    }
  )
  .option('--credentials [string]', 'Credentials: type, username and password')
  .action(async (options: FetchRunOptions) => {
    import('./fetcher.js').then(action => action.run(options));
  });

cli
  .command('process', 'Process changed resources')
  .option(
    '--file-with-metadata <string>',
    'CSV file containing the metadata of changed resources'
  )
  .option(
    '--dir-with-files-with-metadata-of-changes <string>',
    'Directory for storing the metadata of changed resources'
  )
  .option(
    '--number-of-lines-per-file-with-metadata <number>',
    'Number of lines per metadata file'
  )
  .option('--dir-with-changes <string>', 'Directory for storing the changes')
  .option(
    '--wait-between-requests [number]',
    'Wait between requests, in milliseconds',
    {
      default: 0,
    }
  )
  .option(
    '--number-of-concurrent-requests [number]',
    'Number of concurrent requests',
    {
      default: 1,
    }
  )
  .option('--credentials [string]', 'Credentials: type, username and password')
  .option('--headers [string]', 'Headers for dereferencing the changes')
  .action(async (options: ProcessRunOptions) => {
    import('./processor.js').then(action => action.run(options));
  });

cli.help();
cli.parse();
