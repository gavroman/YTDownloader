import {mkdir, access, unlink} from 'node:fs/promises';

export const createDirIfNotExists = async (dirname: string) =>
    access(dirname)
        .then(() => {})
        .catch(() => mkdir(dirname));

export const exists = async (path: string) =>
    access(path)
        .then(() => true)
        .catch(() => false);

export const deleteFile = async (path: string) =>
    access(path)
        .then(() => unlink(path))
        .catch(() => {});
