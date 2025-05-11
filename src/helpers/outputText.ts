import {CloudStoredFile, DisplayFormat, StoredMessageData} from '@src/app/types';
import {getResolution} from '@src/utils/strings';
import {escapers} from '@telegraf/entity';
import {format, intervalToDuration} from 'date-fns';
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

export const getTextFromDisplayFormat = ({video: v}: DisplayFormat) =>
    [
        ['Разрешение', `<b>${getResolution(v)}</b>`],
        ['Битрейт', escapers.HTML(`video - ${v.vbr}`)],
        ['Кодеки', escapers.HTML(`video - ${v.vcodec}`)],
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
    extra: Parameters<C['editMessageText']>[1],
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

export const getTextFromUploadedFile = ({name, url, size, lastModified}: CloudStoredFile) =>
    [
        ['Название', getLink(escapers.HTML(name), url)],
        ['Размер', escapers.HTML(filesize(size))],
        ['Дата загрузки', escapers.HTML(format(lastModified, 'dd.MM.yyyy HH:mm:ss'))],
    ]
        .map(([caption, value], i) => `${i ? ' '.repeat(8) : ''}<code>${caption}:</code> ${value}`)
        .join('\n');

export const joinAndSplitByLimit = (strings: string[], maxCharsLimit: number, joiner: string): string[] => {
    const result: string[] = [];
    let currentString = '';

    for (const str of strings) {
        if (currentString.length + str.length <= maxCharsLimit) {
            currentString += joiner + str;
        } else {
            result.push(currentString);
            currentString = str;
        }
    }

    result.push(currentString);

    return result.filter(Boolean);
};
