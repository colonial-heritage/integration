#!/bin/env node

import {cac} from 'cac';
import type {RunOptions as FetchRunOptions} from './fetcher.js';
import type {RunOptions as ProcessRunOptions} from './processor.js';
import type {RunOptions as UploadRunOptions} from './uploader.js';

const cli = cac();

cli
  .command('fetch', 'Fetch IRIs of changed resources')
  .option('--collection-iri <string>', 'Collection IRI')
  .option('--file-with-run <string>', 'File for storing the run')
  .option(
    '--file-with-metadata <string>',
    'CSV file for storing the metadata of changed resources'
  )
  .option(
    '--dir-with-queue <string>',
    'Directory for storing the metadata of changed resources'
  )
  .option(
    '--number-of-lines-per-file-with-metadata <number>',
    'Number of lines per metadata file, e.g. 10 or 10000'
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
    '--dir-with-queue <string>',
    'Directory with files with metadata of changed resources'
  )
  .option(
    '--number-of-files-to-process <number>',
    'Number of files in the queue to process, e.g. 10 or 100'
  )
  .option(
    '--dir-with-resources <string>',
    'Directory for storing the changed resources'
  )
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

cli
  .command('upload', 'Upload changes to data platform')
  .option('--triplydb-instance-url <string>', 'TriplyDB instance URL')
  .option('--triplydb-api-token <string>', 'TriplyDB API token')
  .option('--triplydb-account <string>', 'TriplyDB account')
  .option('--triplydb-dataset <string>', 'TriplyDB dataset')
  .option(
    '--dir-with-resources <string>',
    'Directory containing the changed resources to upload'
  )
  .option('--dir-temp <string>', 'Directory for storing temporary files')
  .option(
    '--graph-name <string>',
    'Name of the graph to upload the RDF files to'
  )
  .action(async (options: UploadRunOptions) => {
    import('./uploader.js').then(action => action.run(options));
  });

cli.help();
cli.parse();
