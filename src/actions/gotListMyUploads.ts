import {MAX_CHARS_IN_MESSAGE} from '@src/app/constants';
import {BotMessageContext} from '@src/app/types';
import {asyncHandler} from '@src/helpers/highOrderHandler';
import {getTextFromUploadedFile, joinAndSplitByLimit} from '@src/helpers/outputText';
import {resolveModuleLoggerSync} from '@src/services/logger';
import {S3} from '@src/services/s3';
import {replyOnMessage} from '@src/utils/telegraf';

export const gotListMyUploads = asyncHandler(async (ctx: BotMessageContext) => {
    const logger = resolveModuleLoggerSync(ctx, 'gotListMyUploads');

    const s3 = await S3.init(ctx.logger);
    const files = await s3.getDirnameFiles(`/users/${ctx.from.username || ctx.from.id}`);
    logger.info('files', {files, amount: files?.length || 0});
    if (!files || !files.length) {
        return ctx.reply('Нет загруженных файлов');
    }

    const messages = joinAndSplitByLimit(files.map(getTextFromUploadedFile), MAX_CHARS_IN_MESSAGE, '\n\n');
    logger.info('messsagesCount', {length: messages.length});

    for (const messageText of messages) {
        await replyOnMessage(ctx, messageText, {parse_mode: 'HTML'});
    }
});
