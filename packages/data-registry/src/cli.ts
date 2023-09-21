#!/bin/env node

import {cac} from 'cac';
import type {RunOptions as UploadRunOptions} from './uploader.js';

const cli = cac();

cli
  .command('upload', 'Upload RDF files to TriplyDB')
  .option('--triplydb-instance-url <string>', 'TriplyDB instance URL')
  .option('--triplydb-api-token <string>', 'TriplyDB API token')
  .option('--triplydb-account <string>', 'TriplyDB account')
  .option('--triplydb-dataset <string>', 'TriplyDB dataset')
  .option('--triplydb-service-name <string>', 'TriplyDB service name')
  .option('--triplydb-service-type <string>', 'TriplyDB service type')
  .option(
    '--file-pattern <string>',
    'File pattern, matching the files to upload'
  )
  .action(async (options: UploadRunOptions) => {
    import('./uploader.js').then(action => action.run(options));
  });

cli.help();
cli.parse();
