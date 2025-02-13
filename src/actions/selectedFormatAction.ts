import {getMessageEditor, getTextFromMessageStoredData, textJoiner2Lines} from '@src/helpers/outputText';
import {FFMPEG} from '@src/services/ffmpeg';
import {MessageService} from '@src/services/messages';
import {YtDlp} from '@src/services/yt-dlp';
import {BotCallbackDataContext} from '@src/types';
import {deleteFile} from '@src/utils/file.js';
import {omit} from '@src/utils/pick';
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
    if (!tryToUploadInTg && !ctx.S3) {
        return ctx.editMessageText('Мне некуда грузить видос. Облако недоступно(');
    }

    if (
        !ctx.callbackQuery.message ||
        !('reply_to_message' in ctx.callbackQuery.message) ||
        !ctx.callbackQuery.message.reply_to_message?.message_id
    ) {
        return ctx.editMessageText(
            'Немогу прочитать прошлое сообщение, чтбы достать ссылку. Отправь ссылку еще раз.'
        );
    }

    const editMessageTextHTML = getMessageEditor(ctx, {parse_mode: 'HTML'});

    const {videoFormatId, audioFormatId} = parseCallbackData(ctx.callbackQuery.data);
    if (!videoFormatId || !audioFormatId) {
        return ctx.editMessageText(
            'Что-то сломалось, не понял какой формат был выбран. Можно еще раз ссылочку?'
        );
    }

    const messageId = ctx.callbackQuery.message.reply_to_message.message_id;
    const videoData = await MessageService.getMessage(ctx, String(messageId));
    if (!videoData) {
        return ctx.editMessageText('Забыл про это видео, можно еще раз ссылочку?');
    }

    const baseText = getTextFromMessageStoredData(omit(videoData, ['videoUrl', 'formats']));
    const withBaseText = (text: string) => textJoiner2Lines(baseText, text);

    editMessageTextHTML(withBaseText('Расчехляю скачивалку'));

    const formats = await MessageService.getFormatsByMessageId(ctx, String(messageId), {
        videoFormatId,
        audioFormatId,
    });
    if (!formats?.audio || !formats?.video) {
        return editMessageTextHTML(withBaseText('Не нашел такой формат, можно еще раз ссылочку?'));
    }

    editMessageTextHTML(withBaseText('Качаю видос'));

    const {videoUrl: url, videoTitle} = videoData;
    const yt = await YtDlp.init(ctx.from);
    const videoPromise = yt
        .$downloadFormat({outputFilename: String(messageId), url, ...formats.video})
        .catch((e) => {
            console.error('Download video Error', e);
            return null;
        });
    const audioPromise = yt
        .$downloadFormat({outputFilename: String(messageId), url, ...formats.audio})
        .catch((e) => {
            console.error('Download audio Error', e);
            return null;
        });

    const [videoFilePath, audioFilePath] = await Promise.all([videoPromise, audioPromise]);
    if (!videoFilePath || !audioFilePath) {
        return editMessageTextHTML(withBaseText('Не смог скачать. Можно еще раз ссылочку?'));
    }

    console.log('gavromanLog: videoFilePath', videoFilePath);
    console.log('gavromanLog: audioFilePath', audioFilePath);

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
    const resultFilePath = await FFMPEG.$mergeAudioAndVideo(
        videoFilePath,
        audioFilePath,
        storedFileName
    ).catch((e) => {
        console.error('Merge Error', e);
        return null;
    });
    if (!resultFilePath) {
        return editMessageTextHTML(
            withBaseText('Не смог соединить видео и аудио. Начинаем все с начала. Можно еще раз ссылочку?')
        );
    }
    console.log('resultFilePath:', resultFilePath);

    await deleteFile(videoFilePath);
    await deleteFile(audioFilePath);

    const displayFileName = [
        filenamify(videoTitle, {replacement: '_'}),
        getResolution(formats.video),
        'mp4',
    ].join('.');
    try {
        // грузим в телегу
        await ctx.replyWithDocument(
            {source: resultFilePath},
            {reply_parameters: {message_id: messageId}, caption: displayFileName}
        );
    } catch (e) {
        console.error('TgUploadError', e);
        const tgUploadErrorText = withBaseText(
            'Произошла ошибка при загрузке этого видоса в телеграмм, возможно файл слишком большой'
        );
        if (!ctx.S3) {
            // если нет с3 то все
            console.error('S3 not inited');
            return ctx.editMessageText(tgUploadErrorText);
        }

        // если есть s3 - грузим
        const uploadS3Text = textJoiner2Lines(tgUploadErrorText, 'Загружаю в облако');

        editMessageTextHTML(uploadS3Text);

        const s3DownloadUrl = await ctx.S3.uploadFile(
            {path: resultFilePath, name: displayFileName},
            `/${ctx.from.username || ctx.from.id}`
        );

        if (!s3DownloadUrl) {
            return editMessageTextHTML(withBaseText('Произошла ошибка при загрузке в облако'));
        }

        editMessageTextHTML(withBaseText(`Скаченное видео доступно по ссылке: ${s3DownloadUrl}`));
    }

    MessageService.deleteMessage(ctx, messageId).catch(console.error);
    await deleteFile(resultFilePath);
};
