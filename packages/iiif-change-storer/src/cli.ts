#!/bin/env node

import {cac} from 'cac';
import type {RunOptions as FetchRunOptions} from './fetcher.js';

const cli = cac();

cli
  .command('fetch', 'Fetch IRIs of changed resources')
  .option('--collection-iri <string>', 'Collection IRI')
  .option('--dir-with-runs <string>', 'Directory for storing the runs')
  .option(
    '--file-with-changes <string>',
    'File for storing the IRIs of changed resources'
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

cli.help();
cli.parse();
