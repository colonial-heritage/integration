# IIIF Change Processor

CLI for processing changes from a IIIF Change Discovery service

## Commands

### Fetch IRIs of changed resources

    ./dist/cli.js fetch \
      --collection-iri "https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes" \
      --file-with-run "./tmp/bodleian/run.nt" \
      --file-with-metadata "./tmp/bodleian/metadata.csv" \
      --dir-with-queue "./tmp/bodleian/queue" \
      --number-of-lines-per-file-with-metadata 1000 \
      --wait-between-requests 0

Or with additional settings:

    ./dist/cli.js fetch \
      --collection-iri "https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes" \
      --file-with-run "./tmp/bodleian/run.nt" \
      --file-with-metadata "./tmp/bodleian/metadata.csv" \
      --dir-with-queue "./tmp/bodleian/queue" \
      --number-of-lines-per-file-with-metadata 1000 \
      --wait-between-requests 0 \
      --credentials.type "basic-auth" \
      --credentials.username "my-username" \
      --credentials.password "my-password"

### Process changed resources

    ./dist/cli.js process \
      --dir-with-queue "./tmp/bodleian/queue" \
      --number-of-files-to-process 1 \
      --dir-with-resources "./tmp/bodleian/resources" \
      --wait-between-requests 0 \
      --number-of-concurrent-requests 25

Or with additional settings:

    ./dist/cli.js process \
      --dir-with-queue "./tmp/bodleian/queue" \
      --number-of-files-to-process 1 \
      --dir-with-resources "./tmp/bodleian/resources" \
      --wait-between-requests 0 \
      --number-of-concurrent-requests 25 \
      --credentials.type "basic-auth" \
      --credentials.username "my-username" \
      --credentials.password "my-password" \
      --headers.accept "application/ld+json"

### Upload changed resources to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_DEVELOPMENT" \
      --triplydb-dataset "iiif-change-discovery-demo" \
      --dir-with-resources "./tmp/bodleian/resources" \
      --dir-temp "./tmp/bodleian" \
      --graph-name "https://data.colonialcollections.nl/bodleian"
