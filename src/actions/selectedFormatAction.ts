import {
    getLink,
    getMessageEditor,
    getTextFromMessageStoredData,
    textJoiner2Lines,
} from '@src/helpers/outputText';
import {FFMPEG} from '@src/services/ffmpeg';
import {resolveModuleLoggerSync} from '@src/services/logger';
import {MessageService} from '@src/services/messages';
import {YtDlp} from '@src/services/yt-dlp';
import {BotCallbackDataContext} from '@src/types';
import {deleteFile} from '@src/utils/file.js';
import {pick} from '@src/utils/pick';
import {getResolution} from '@src/utils/strings';
import filenamify from 'filenamify';

const parseCallbackData = (
    input: string
): {videoFormatId: Nullable<string>; audioFormatId: Nullable<string>} => {
    try {
        const {v: videoFormatId, a: audioFormatId} = JSON.parse(input);

        return {videoFormatId, audioFormatId};
    } catch (_e) {
        return {videoFormatId: null, audioFormatId: null};
    }
};
export const onSelectedFormatAction = async (ctx: BotCallbackDataContext, tryToUploadInTg?: boolean) => {
    const logger = resolveModuleLoggerSync(ctx, 'gotVideoUrlAction');

    if (!tryToUploadInTg && !ctx.S3) {
        logger.error('inputData', {tryToUploadInTg, ctxS3: ctx.S3});

        return ctx.editMessageText('Мне некуда грузить видос. Облако недоступно(');
    }

    if (
        !ctx.callbackQuery.message ||
        !('reply_to_message' in ctx.callbackQuery.message) ||
        !ctx.callbackQuery.message.reply_to_message?.message_id
    ) {
        logger.error('no reply message');

        return ctx.editMessageText(
            'Немогу прочитать прошлое сообщение, чтобы достать ссылку. Отправь ссылку еще раз.'
        );
    }
    logger.verbose('onSelectedFormatAction', ctx.callbackQuery.data);

    const editMessageTextHTML = getMessageEditor(ctx, {parse_mode: 'HTML'});
    const {videoFormatId, audioFormatId} = parseCallbackData(ctx.callbackQuery.data);
    if (!videoFormatId || !audioFormatId) {
        logger.error('no videoFormatId or audioFormatId');

        return ctx.editMessageText(
            'Что-то сломалось, не понял какой формат был выбран. Можно еще раз ссылочку?'
        );
    }

    const messageId = ctx.callbackQuery.message.reply_to_message.message_id;
    logger.info('messageId', messageId);
    const videoData = await MessageService.getMessage(ctx, String(messageId));
    if (!videoData) {
        logger.error('no videoData');

        return ctx.editMessageText('Забыл про это видео, можно еще раз ссылочку?');
    }
    logger.info('videoData', videoData);

    const baseText = getTextFromMessageStoredData(pick(videoData, ['videoTitle', 'videoDuration']));
    const withBaseText = (text: string) => textJoiner2Lines(baseText, text);
    editMessageTextHTML(withBaseText('Расчехляю скачивалку'));

    const formats = await MessageService.getFormatsByMessageId(ctx, String(messageId), {
        videoFormatId,
        audioFormatId,
    });
    if (!formats?.audio || !formats?.video) {
        logger.error('no formats');

        return editMessageTextHTML(withBaseText('Не нашел такой формат, можно еще раз ссылочку?'));
    }

    editMessageTextHTML(withBaseText('Качаю видос'));

    const {videoUrl: url, videoTitle} = videoData;
    const yt = await YtDlp.init(ctx.from, ctx.logger);

    const videoPromise = yt.$downloadFormat({outputFilename: String(messageId), url, ...formats.video});
    const audioPromise = yt.$downloadFormat({outputFilename: String(messageId), url, ...formats.audio});
    const [videoFilePath, audioFilePath] = await Promise.all([videoPromise, audioPromise]);

    if (!videoFilePath || !audioFilePath) {
        logger.error('no videoFilePath or audioFilePath');

        return editMessageTextHTML(withBaseText('Не смог скачать. Можно еще раз ссылочку?'));
    }
    logger.info({videoFilePath, audioFilePath});

    const mergeSatartText = withBaseText('Соединяю аудио и видео дорожки');
    editMessageTextHTML(mergeSatartText);

    const resolution = getResolution(formats.video);
    const storedFileName = [
        String(messageId),
        resolution,
        formats.video.format_id,
        formats.audio.format_id,
        'mp4',
    ].join('.');
    logger.info({storedFileName});

    const resultFilePath = await FFMPEG.$mergeAudioAndVideo(
        videoFilePath,
        audioFilePath,
        storedFileName
    ).catch((e) => {
        logger.error('Merge Error', {videoFilePath, audioFilePath, storedFileName}, e);

        return null;
    });
    if (!resultFilePath) {
        logger.error('resultFilePath is null');

        return editMessageTextHTML(
            withBaseText('Не смог соединить видео и аудио. Начинаем все с начала. Можно еще раз ссылочку?')
        );
    }
    logger.info({resultFilePath});

    await deleteFile(videoFilePath);
    await deleteFile(audioFilePath);

    const displayFileName = [
        filenamify(videoTitle, {replacement: '_'}),
        getResolution(formats.video),
        'mp4',
    ].join('.');
    logger.info({displayFileName});

    try {
        // грузим в телегу
        await ctx.replyWithDocument(
            {source: resultFilePath},
            {reply_parameters: {message_id: messageId}, caption: displayFileName}
        );
        logger.info('video uploaded in tg');
    } catch (_e) {
        logger.warn('failed to upload video to tg');
        const tgUploadErrorText = withBaseText(
            'Произошла ошибка при загрузке этого видоса в телеграмм, возможно файл слишком большой'
        );
        if (!ctx.S3) {
            // если нет с3 то все
            logger.error('S3 not inited');

            return ctx.editMessageText(tgUploadErrorText);
        }

        // если есть s3 - грузим
        const uploadS3Text = textJoiner2Lines(tgUploadErrorText, 'Загружаю в облако');
        editMessageTextHTML(uploadS3Text);

        const s3DownloadUrl = await ctx.S3.uploadUserVideoFile(
            {path: resultFilePath, name: displayFileName},
            String(ctx.from.username || ctx.from.id)
        );
        if (!s3DownloadUrl) {
            logger.error('s3DownloadUrl is null');

            return editMessageTextHTML(withBaseText('Произошла ошибка при загрузке в облако'));
        }
        logger.info({s3DownloadUrl});

        editMessageTextHTML(
            withBaseText(`Скаченное видео доступно по ссылке: ${getLink(videoTitle, s3DownloadUrl)}`)
        );
    }

    MessageService.deleteMessage(ctx, messageId).catch((_e) => {
        logger.warn('failed to delete message', _e);
    });
    deleteFile(resultFilePath).catch((_e) => {
        logger.warn('failed to delete filed', _e);
    });
};
