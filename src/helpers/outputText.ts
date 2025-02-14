import {DisplayFormat, StoredMessageData} from '@src/types';
import {getResolution} from '@src/utils/strings';
import {escapers} from '@telegraf/entity';
import {intervalToDuration} from 'date-fns';
import {filesize} from 'filesize';
import {Context} from 'telegraf';
import {Update} from 'telegraf/types';

export const getTextFromMessageStoredData = ({
    videoUrl,
    videoDuration,
    videoTitle,
    formats = [],
}: Partial<StoredMessageData>) => {
    const formatsString = formats.map(getTextFromDisplayFormat).join('\n\n');

    return [
        videoUrl ? `<u> Ссылка</u>: ${videoUrl}` : null,
        videoTitle ? `<u> Название</u>: ${escapers.HTML(videoTitle)}` : null,
        videoDuration ? `<u> Длительность</u>: ${videoDuration}` : null,

        ...(formatsString.length ? ['\n\n<u> Форматы</u>:', formatsString] : [null]),
    ]
        .filter(Boolean)
        .join('\n');
};

export const getTextFromDisplayFormat = ({video: v, audio: a}: DisplayFormat) =>
    [
        [
            'Разрешение',
            `<b>${getResolution(v)}</b> ${escapers.HTML(v.format_note) || ''} ${a.format_note ? `(audio: ${escapers.HTML(a.format_note)})` : ''}`,
        ],
        ['Размер', escapers.HTML(filesize(v.filesize + a.filesize))],
        ['Размер видео', v.filesizeHumanReadable ? escapers.HTML(v.filesizeHumanReadable) : v.filesize],
        ['Битрейт видео', escapers.HTML(String(v.vbr))],
        ['Размер аудио', a.filesizeHumanReadable ? escapers.HTML(a.filesizeHumanReadable) : a.filesize],
        ['Битрейт аудио', escapers.HTML(String(a.abr))],
    ]
        .map(([caption, value], i) => `${i ? ' '.repeat(8) : ''}<code>${caption}:</code> ${value}`)
        .join('\n');

export const getDurationString = (duration: number) => {
    const {hours = 0, minutes = 0, seconds = 0} = intervalToDuration({start: 0, end: duration});

    return [hours, minutes, seconds]
        .map(String)
        .map((n) => (n.length === 1 ? `0${n}` : n))
        .filter(Boolean)
        .join(' : ');
};

export const getUpdateAppendMessageEditor = <C extends Context<Update>>(
    ctx: C,
    extra: Parameters<C['editMessageText']>[1]
) => {
    let updateCounter = 0;
    let oldText = '';

    return async (text: string) => {
        const newText = oldText ? textJoiner1Line(oldText, `${updateCounter}) ${text}`) : text;

        await ctx.editMessageText(newText, extra);
        oldText = newText;
        updateCounter++;
    };
};

export const textJoiner2Lines = (...strings: string[]) => strings.join('\n\n');

export const textJoiner1Line = (...strings: string[]) => strings.join('\n');

export const getLoader = (i: number) => ' .'.repeat(i % 8);

export const getLink = (text: string, url: string) => `<a href="${url}">${text}</a>`;
