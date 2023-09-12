#!/bin/env node

import {cac} from 'cac';
import type {RunOptions as UploadRunOptions} from './uploader.js';

const cli = cac();

cli
  .command('upload', 'Upload RDF files to TriplyDB')
  .option('--triplydb-instance-url', 'TriplyDB instance URL')
  .option('--triplydb-api-token', 'TriplyDB API token')
  .option('--triplydb-account', 'TriplyDB account')
  .option('--triplydb-dataset', 'TriplyDB dataset')
  .option('--triplydb-service-name', 'TriplyDB service name')
  .option('--triplydb-service-type', 'TriplyDB service type')
  .option('--file-pattern', 'File pattern, matching the files to upload')
  .action(async (options: UploadRunOptions) => {
    import('./uploader.js').then(action => action.run(options));
  });

cli.help();
cli.parse();
