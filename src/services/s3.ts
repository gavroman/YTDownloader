import {getEnv} from '@src/app/env';
import {CloudStoredFile} from '@src/app/types';
import {AbstractService, ServiceAsyncInitFn} from '@src/services/types';
import type EasyYandexS3 from 'easy-yandex-s3';
import EasyYandexS3Module from 'easy-yandex-s3';
import winston from 'winston';

type UploadFileParams = {
    path: string;
    name?: string;
};

type Props = Required<Partial<Pick<ReturnType<typeof getEnv>, 's3BucketName' | 's3keyId' | 's3keySecret'>>>;

export class S3 extends AbstractService<Props> {
    private readonly YandexS3: EasyYandexS3;

    public static init: ServiceAsyncInitFn<EmptyObject | void, S3> = async (logger): Promise<S3> => {
        const {s3keyId, s3keySecret, s3BucketName} = getEnv();
        if (s3keyId && s3keySecret && s3BucketName) {
            return new S3({s3BucketName, s3keyId, s3keySecret}, logger);
        }

        const message = 'S3 service is not initialized. Failed to get secrets';
        logger.error(message);
        throw new Error(message);
    };

    private constructor(props: Props, logger: winston.Logger) {
        super(props, logger, 'S3');
        const {s3BucketName, s3keyId, s3keySecret} = props;

        try {
            this.YandexS3 = // @ts-expect-error EasyYandexS3Module import
                new (EasyYandexS3Module.default ? EasyYandexS3Module.default : EasyYandexS3Module)({
                    auth: {accessKeyId: s3keyId, secretAccessKey: s3keySecret},
                    Bucket: s3BucketName,
                    debug: true,
                });
        } catch (e) {
            this.logger.error(e);
            throw e;
        }

        return this;
    }

    public async uploadUserFile(
        {path, name}: UploadFileParams,
        userDirname: string,
    ): Promise<Nullable<string>> {
        const fullS3dirname = userDirname ? `/users/${userDirname}` : '/';
        try {
            const result = await this.YandexS3.Upload({path, name, save_name: !name}, fullS3dirname);
            this.logger.info('uploadUserVideoFile', result);

            return !result || Array.isArray(result) ? null : result.Location;
        } catch (e) {
            this.logger.error(e);

            return null;
        }
    }

    public async getDirnameFiles(dirname = '/'): Promise<Nullable<CloudStoredFile[]>> {
        try {
            const {Bucket} = this.YandexS3;

            const result = await this.YandexS3.GetList(dirname);
            if (!result) {
                this.logger.error('getDirnameFiles', 'result is null');

                return null;
            }

            const files = (
                await Promise.all(
                    (result.Contents || []).map<Promise<Nullable<CloudStoredFile>>>(
                        async ({Key: key, Size: size, LastModified: lastModified}) => {
                            if (!key || !size || !lastModified) {
                                return null;
                            }

                            const urlString = await this.YandexS3.s3.getSignedUrlPromise('getObject', {
                                Bucket,
                                Key: key,
                            });
                            const url = new URL(urlString);
                            url.search = '';

                            const name = key.split('/').pop() || key;

                            return {name, size, lastModified, url: url.toString()};
                        },
                    ),
                )
            ).filter<CloudStoredFile>((file): file is CloudStoredFile => !!file);

            this.logger.info('getDirnameFiles', {files});

            return files;
        } catch (e) {
            this.logger.error(e);

            return null;
        }
    }
}
