# Change Discoverer

CLI for discovering and processing changes.

## Build

    npm run build

## Commands

### Development

#### Discover, fetch and store changes

    ./dist/cli.js discover \
      --collection-iri "https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes" \
      --dir "./tmp/bodleian" \
      --wait-between-requests 100 \
      --number-of-concurrent-requests 5

#### Upload RDF files to TriplyDB

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_DEVELOPMENT" \
      --triplydb-dataset "$TRIPLYDB_DATASET_KG_DEVELOPMENT" \
      --dir "./tmp/bodleian" \
      --graph-name "https://data.colonialcollections.nl/bodleian"
