import {getEnv} from '@src/services/env';
import {S3} from '@src/services/s3';
import type {BotContext} from '@src/types';
import type {MiddlewareFn} from 'telegraf';

export const initS3Middlware: MiddlewareFn<BotContext> = async (ctx, next) => {
    const {s3keyId, s3keySecret, s3BucketName} = getEnv();
    if (!ctx.S3 && s3keyId && s3keySecret && s3BucketName) {
        ctx.S3 = new S3({s3BucketName, s3keyId, s3keySecret, logger: ctx.logger});
    }

    return next();
};
