import {mkdir, exists} from 'node:fs/promises';

export const createDirIfNotExists = async (dirname: string) =>
    exists(dirname).then((exists) => (!exists ? mkdir(dirname, {recursive: true}) : undefined));
