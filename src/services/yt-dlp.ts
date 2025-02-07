import {Format} from '@src/types';
import {createDirIfNotExists} from '@src/utils/file';
import {pick} from '@src/utils/pick';
import {getUserDirname} from '@src/utils/telegraf';
import {$} from 'bun';
import {filesize as fileSize} from 'filesize';
import path from 'path';
import {User} from 'telegraf/types';

const FILTERED_FORMAT_FIELDS = [
    'format_id',
    'format',
    'format_note',
    'ext',
    'protocol',
    'width',
    'height',
    'audio_ext',
    'video_ext',
    'vbr',
    'abr',
    'tbr',
    'filesize',
    'quality',
];

export type VideoData = {
    title: string;
    duration: number;
    formats: Format[];
};

export type PartialFormatDownloadInfo = Pick<Format, 'format_id' | 'ext' | 'video_ext' | 'audio_ext'>;

export type DownloadFormatInput = {
    url: string;
    outputFilename: string;
} & PartialFormatDownloadInfo;

export const isVideoFormat = (format: Pick<Format, 'video_ext'>) => format.video_ext !== null;
export const isAudioFormat = (format: Pick<Format, 'audio_ext'>) => format.audio_ext !== null;

export const getFormatFilename = (partialFormat: PartialFormatDownloadInfo) => {
    const {format_id, ext} = partialFormat;
    const formatType = isVideoFormat(partialFormat) ? 'video' : 'audio';

    return `${format_id}.${formatType}.${ext}`;
};

export class YtDlp {
    static async init(user: User) {
        const userDirname = getUserDirname(user);
        await createDirIfNotExists(userDirname);
        return new YtDlp(userDirname);
    }

    private constructor(private dirname: string) {}

    public async $getVideoInfo(url: string): Promise<VideoData> {
        const output = await $`yt-dlp -S filesize --list-formats -j ${url}`;
        const outputString = output.text('utf-8');
        const jsonString = outputString.slice(outputString.indexOf('{'));

        const {formats, title, duration} = JSON.parse(jsonString);
        const processedFormats = (formats as AnyObject[])
            .map<Format>((format) => {
                const processedFormat = pick(format, FILTERED_FORMAT_FIELDS, null);

                const {audio_ext, video_ext, filesize} = processedFormat;
                processedFormat.audio_ext = audio_ext === 'none' ? null : audio_ext;
                processedFormat.video_ext = video_ext === 'none' ? null : video_ext;
                processedFormat.filesizeHumanReadable = filesize ? fileSize(filesize) : null;

                return processedFormat as Format;
            })
            .filter((f) => f.video_ext || f.audio_ext);

        return {title, duration: duration * 1000, formats: processedFormats};
    }

    public async $downloadFormat({outputFilename, url, ...format}: DownloadFormatInput) {
        const {format_id} = format;
        const formatFilename = getFormatFilename(format);
        const filePath = path.join(this.dirname, `${outputFilename}.${formatFilename}`);

        const output = await $`yt-dlp --allow-unplayable --format ${format_id} -o ${filePath} ${url}`;
        const outputString = output.text('utf-8');

        console.log('downloadFormat: outputString\n', outputString);

        return filePath;
    }
}
