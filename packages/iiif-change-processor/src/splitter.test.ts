import {splitFileByLines} from './splitter.js';
import {glob} from 'glob';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('splitFileByLines', () => {
  const outputDir = './tmp/splitter';

  beforeEach(async () => {
    await rimraf(outputDir);
  });

  it('splits file by lines', async () => {
    await splitFileByLines({
      filename: './fixtures/bodleian-metadata.csv',
      numberOfLines: 2,
      outputDir,
    });

    const files = await glob(`${outputDir}/**`, {nodir: true});

    expect(files).toStrictEqual([
      'tmp/splitter/bodleian-metadata.csv.ae',
      'tmp/splitter/bodleian-metadata.csv.ad',
      'tmp/splitter/bodleian-metadata.csv.ac',
      'tmp/splitter/bodleian-metadata.csv.ab',
      'tmp/splitter/bodleian-metadata.csv.aa',
    ]);
  });
});
