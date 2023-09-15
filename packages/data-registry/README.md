# Data Registry

Data used by Colonial Collections.

Changes made to the Turtle files in `data` are automatically propagated to the Knowledge Graph.

## Build

    npm run build

## Commands

### Testing

#### Upload all RDF files to the Knowledge Graph

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_TESTING" \
      --triplydb-dataset "$TRIPLYDB_DATASET_KG_TESTING" \
      --triplydb-service-name "kg" \
      --triplydb-service-type "virtuoso" \
      --file-pattern "data/testing/**/*.ttl"

#### Upload a specific RDF file to the Knowledge Graph

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_TESTING" \
      --triplydb-dataset "$TRIPLYDB_DATASET_KG_TESTING" \
      --triplydb-service-name "kg" \
      --triplydb-service-type "virtuoso" \
      --file-pattern "data/testing/datasets.ttl"
