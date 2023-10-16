# IIIF Change Processor

CLI for processing changes from a IIIF Change Discovery service

## Build

    npm run build

## Commands

### Fetch changes

    ./dist/cli.js fetch \
      --collection-iri "https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes" \
      --dir-with-runs "./tmp/bodleian/runs" \
      --dir-with-changes "./tmp/bodleian/changes" \
      --wait-between-requests 500 \
      --number-of-concurrent-requests 25

### Upload changes to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_DEVELOPMENT" \
      --triplydb-dataset "iiif-change-discovery-demo" \
      --dir-with-changes "./tmp/bodleian/changes" \
      --dir-temp "./tmp/bodleian" \
      --graph-name "https://data.colonialcollections.nl/bodleian"
