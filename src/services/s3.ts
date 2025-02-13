import {getEnv} from '@src/services/env';
import type EasyYandexS3 from 'easy-yandex-s3';
import EasyYandexS3Module from 'easy-yandex-s3';

type UploadFile = {
    path: string;
    name?: string;
};

export class S3 {
    private readonly YandexS3: EasyYandexS3;

    constructor(
        props: Required<Partial<Pick<ReturnType<typeof getEnv>, 's3BucketName' | 's3keyId' | 's3keySecret'>>>
    ) {
        const {s3BucketName, s3keyId, s3keySecret} = props;

        // @ts-expect-error EasyYandexS3Module import
        this.YandexS3 = new EasyYandexS3Module.default({
            auth: {accessKeyId: s3keyId, secretAccessKey: s3keySecret},
            Bucket: s3BucketName,
            debug: true,
        });

        return this;
    }

    public async uploadFile({path, name}: UploadFile, dirname: string): Promise<Nullable<string>> {
        try {
            const result = await this.YandexS3.Upload({path, name, save_name: !name}, dirname);
            return !result || Array.isArray(result) ? null : result.Location;
        } catch (e) {
            console.error('S3 error', e);
            return null;
        }
    }
}
