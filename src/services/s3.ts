import {getEnv} from '@src/services/env';
import {omit} from '@src/utils/pick';
import type EasyYandexS3 from 'easy-yandex-s3';
import EasyYandexS3Module from 'easy-yandex-s3';
import winston from 'winston';

type UploadFile = {
    path: string;
    name?: string;
};

type Props = {
    logger: winston.Logger;
} & Required<Partial<Pick<ReturnType<typeof getEnv>, 's3BucketName' | 's3keyId' | 's3keySecret'>>>;

export class S3 {
    private readonly YandexS3: EasyYandexS3;
    private readonly logger: winston.Logger;

    constructor(props: Props) {
        const {s3BucketName, s3keyId, s3keySecret, logger} = props;
        // @ts-expect-error EasyYandexS3Module import
        this.YandexS3 = new EasyYandexS3Module.default({
            auth: {accessKeyId: s3keyId, secretAccessKey: s3keySecret},
            Bucket: s3BucketName,
            debug: true,
        });

        this.logger = logger.child({module: 'S3'});
        this.logger.info('S3 initialized', omit(props, ['logger']));

        return this;
    }

    public async uploadUserVideoFile({path, name}: UploadFile, dirname: string): Promise<Nullable<string>> {
        const fullS3dirname = dirname ? `/users/${dirname}` : '/';
        try {
            const result = await this.YandexS3.Upload({path, name, save_name: !name}, fullS3dirname);
            this.logger.info('uploadUserVideoFile', result);

            return !result || Array.isArray(result) ? null : result.Location;
        } catch (e) {
            this.logger.error(e);

            return null;
        }
    }
}
