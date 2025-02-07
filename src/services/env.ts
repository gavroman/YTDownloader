import {config} from 'dotenv';

export const getEnv = () => {
    config();
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        throw new Error('BOT_TOKEN is not defined');
    }

    const s3keyId = process.env.S3_STATIC_KEY_ID;
    const s3keySecret = process.env.S3_STATIC_KEY_SECRET;
    const s3BucketName = process.env.S3_BUCKET_NAME;

    return {botToken, s3keyId, s3keySecret, s3BucketName};
};
