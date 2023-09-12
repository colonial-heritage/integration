#!/bin/env node

import {cac} from 'cac';
import type {RunOptions as IterateRunOptions} from './iterator.js';
import type {RunOptions as GenerateRunOptions} from './generator.js';
import type {RunOptions as UploadRunOptions} from './uploader.js';

const cli = cac();

cli
  .command('iterate', 'Collect IRIs from a SPARQL endpoint')
  .option('--endpoint-url', 'SPARQL endpoint URL')
  .option('--query-file', 'Iterate query file')
  .option(
    '--number-of-iris-per-request',
    'Number of IRIs to collect per request',
    {default: 1}
  )
  .option('--wait-between-requests', 'Wait between requests, in milliseconds', {
    default: 500,
  })
  .option('--iri-file', 'File for storing collected IRIs')
  .action(async (options: IterateRunOptions) => {
    import('./iterator.js').then(action => action.run(options));
  });

cli
  .command('generate', 'Generate graph from a SPARQL endpoint')
  .option('--endpoint-url', 'SPARQL endpoint URL')
  .option('--query-file', 'Generate query file')
  .option(
    '--number-of-resources-per-request',
    'Number of resources to generate per request',
    {default: 1}
  )
  .option('--wait-between-requests', 'Wait between requests, in milliseconds', {
    default: 500,
  })
  .option('--number-of-concurrent-requests', 'Number of concurrent requests', {
    default: 1,
  })
  .option('--iri-file', 'File for retrieving the collected IRIs')
  .option('--rdf-file', 'File for storing the generated resources')
  .action(async (options: GenerateRunOptions) => {
    import('./generator.js').then(action => action.run(options));
  });

cli
  .command('upload', 'Upload graph to TriplyDB')
  .option('--triplydb-instance-url', 'TriplyDB instance URL')
  .option('--triplydb-api-token', 'TriplyDB API token')
  .option('--triplydb-account', 'TriplyDB account')
  .option('--triplydb-dataset', 'TriplyDB dataset')
  .option('--triplydb-service-name', 'TriplyDB service name')
  .option('--triplydb-service-type', 'TriplyDB service type')
  .option('--rdf-file', 'RDF file to upload')
  .option('--graph-name', 'Name of the graph to upload the file to')
  .action(async (options: UploadRunOptions) => {
    import('./uploader.js').then(action => action.run(options));
  });

cli.help();
cli.parse();
