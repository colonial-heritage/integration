import {deleteObsoleteResoures} from './deleter.js';
import {glob} from 'glob';
import {existsSync} from 'node:fs';
import {cp, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('deleteObsoleteResoures', () => {
  const iriFile = './fixtures/iris.txt';
  const outputDir = './tmp/deleter';
  const dirWithResources = join(outputDir, 'resources');

  beforeEach(async () => {
    await rimraf(outputDir);
    await mkdir(dirWithResources, {recursive: true});

    await cp('./fixtures/resources', dirWithResources, {recursive: true});
  });

  it('deletes obsolete resources if IRIs match', async () => {
    await deleteObsoleteResoures({
      dirWithResources,
      iriFile,
    });

    const files = await glob(`${dirWithResources}/**/*.nt`, {nodir: true});
    expect(files.length).toBe(2);

    const obsoleteFile = join(
      dirWithResources,
      '3302d891bf3795ab063aaf81cb2fe6f2.nt'
    );
    expect(existsSync(obsoleteFile)).toBe(false);
  });
});
