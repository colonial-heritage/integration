# IIIF Change Storer

CLI for processing changes from a IIIF Change Discovery service

## Commands

### Fetch IRIs of changed resources

    ./dist/cli.js fetch \
      --collection-iri "https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes" \
      --dir-with-runs "./tmp/bodleian/runs" \
      --file-with-changes "./tmp/changed-resources.csv" \
      --wait-between-requests 0

Or with additional settings:

    ./dist/cli.js fetch \
      --collection-iri "https://iiif.bodleian.ox.ac.uk/iiif/activity/all-changes" \
      --dir-with-runs "./tmp/bodleian/runs" \
      --file-with-changes "./tmp/changed-resources.csv" \
      --wait-between-requests 0 \
      --credentials.type "basic-auth" \
      --credentials.username "my-username" \
      --credentials.password "my-password"
