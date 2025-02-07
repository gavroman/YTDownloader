import {getEnv} from '@src/services/env';
import {S3} from '@src/services/s3';
import {beforeEach, describe, expect, it} from 'bun:test';

describe('S3', () => {
    let s3: S3;

    beforeEach(() => {
        const {s3BucketName = '', s3keyId = '', s3keySecret = ''} = getEnv();
        s3 = new S3({s3BucketName, s3keyId, s3keySecret});
    });

    it('inits', () => {
        expect(s3).not.toBeNull();
    });

    it('uploadsFile', async () => {
        const path = '/Users/gavroman/projects/YTDownloader/package.json';
        try {
            const result = await s3.uploadFile({path}, '/');
            expect(result).toBeString();
        } catch (e) {
            console.log(e);
        }
    });
});
