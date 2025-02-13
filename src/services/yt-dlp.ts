import {Format} from '@src/types';
import {createDirIfNotExists, exists} from '@src/utils/file';
import {omit, pick} from '@src/utils/pick';
import {getUserDirname} from '@src/utils/telegraf';
import {filesize as fileSize} from 'filesize';
import path from 'path';
import {User} from 'telegraf/types';
import {getEnv} from '@src/services/env';
import {runCommand} from '@src/utils/runCommand';
import winston from 'winston';

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

type Options = {
    cookiesFilePath?: string;
    socksProxy?: string;
    logger: winston.Logger;
};

export class YtDlp {
    static async init(user: Pick<User, 'username' | 'id'>, logger: winston.Logger) {
        const userDirname = getUserDirname(user);
        await createDirIfNotExists(userDirname);

        const {cookiesFilepath: coockiesArg = 'cookies.txt', socksProxy} = getEnv();
        const cookiesFilePath = path.resolve(coockiesArg);
        if (await exists(cookiesFilePath)) {
            return new YtDlp(userDirname, {cookiesFilePath, socksProxy, logger});
        }

        return new YtDlp(userDirname, {socksProxy, logger});
    }

    private constructor(
        private readonly dirname: string,
        private readonly options: Options
    ) {
        this.logger = options.logger.child({module: 'yt-dlp'});
        this.logger.info('YtDlp initialized', {dirname: this.dirname, options: omit(options, ['logger'])});

        return this;
    }

    private logger: winston.Logger;

    private getCookiesArg() {
        return this.options.cookiesFilePath ? `--cookies ${this.options.cookiesFilePath}` : '';
    }

    private getSocksProxyArg() {
        return this.options.socksProxy ? `--proxy ${this.options.socksProxy}` : '';
    }

    public async $getVideoInfo(url: string): Promise<Nullable<VideoData>> {
        const command = [
            'yt-dlp',
            this.getSocksProxyArg(),
            this.getCookiesArg(),
            '-S',
            'filesize',
            '--list-formats',
            '-j',
            url,
        ].join(' ');
        this.logger.info('getVideoInfo', command);

        const output = await runCommand(command).catch((e) => {
            this.logger.error('getVideoInfo error', e);

            return null;
        });

        if (!output) {
            return null;
        }

        const jsonString = output.slice(output.indexOf('{'));
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

    public async $downloadFormat({
        outputFilename,
        url,
        ...format
    }: DownloadFormatInput): Promise<Nullable<string>> {
        const {format_id} = format;
        const formatFilename = getFormatFilename(format);
        const filePath = path.join(this.dirname, `${outputFilename}.${formatFilename}`);
        const command = [
            'yt-dlp',
            this.getSocksProxyArg(),
            this.getCookiesArg(),
            '--verbose',
            '--allow-unplayable',
            '--format',
            format_id,
            '-o',
            filePath,
            url,
        ].join(' ');

        this.logger.info('downloadFormat', command);

        try {
            await runCommand(command);

            return filePath;
        } catch (e) {
            this.logger.error('downloadFormat', e);

            return null;
        }
    }
}
