import {S3} from '@src/services/s3';
import {testLogger} from '@src/test/testLogger';

describe('S3', () => {
    let s3: S3;

    beforeEach(async () => {
        s3 = await S3.init(testLogger, {});
    });

    it('inits', () => {
        expect(s3).not.toBeNull();
    });

    it('uploadsFile', async () => {
        const path = './package.json';

        const result = await s3.uploadUserFile({path}, 'test-test-test');
        expect(result).not.toBeNull();
    });
});
