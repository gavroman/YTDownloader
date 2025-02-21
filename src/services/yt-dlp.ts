import {Format} from '@src/app/types';
import {createDirIfNotExists, exists} from '@src/utils/file';
import {pick} from '@src/utils/pick';
import {getUserDirname} from '@src/utils/telegraf';
import {filesize as fileSize} from 'filesize';
import path from 'path';
import {User} from 'telegraf/types';
import {getEnv} from '@src/app/env';
import {runCommand} from '@src/utils/runCommand';
import winston from 'winston';
import {AbstractService, ServiceAsyncInitFn} from '@src/services/types';
import {FILTERED_FORMAT_FIELDS} from '@src/app/constants';

export type VideoData = {
    title: string;
    duration: number;
    formats: Format[];
};

export type PartialFormatDownloadInfo = Pick<Format, 'format_id' | 'ext' | 'video_ext' | 'audio_ext'>;

export type DownloadFormatProps = {
    url: string;
    outputFilename: string;
    user: Pick<User, 'id' | 'username'>;
} & PartialFormatDownloadInfo;

export const isVideoFormat = (format: Pick<Format, 'video_ext'>) => format.video_ext !== null;
export const isAudioFormat = (format: Pick<Format, 'audio_ext'>) => format.audio_ext !== null;

export const getFormatFilename = (partialFormat: PartialFormatDownloadInfo) => {
    const {format_id, ext} = partialFormat;
    const formatType = isVideoFormat(partialFormat) ? 'video' : 'audio';

    return `${format_id}.${formatType}.${ext}`;
};

type ConstructorProps = {
    cookiesFilePath?: string;
    socksProxy?: string;
    storageDirname: string;
};

const DEFAULT_STORAGE_DIR = 'video_storage';
const DEFAULT_COOKIES_FILE = 'cookies.txt';

export class YtDlp extends AbstractService<ConstructorProps> {
    static init: ServiceAsyncInitFn<Pick<ConstructorProps, 'storageDirname'> | void, YtDlp> = async (
        logger,
        {storageDirname = DEFAULT_STORAGE_DIR} = {storageDirname: DEFAULT_STORAGE_DIR},
    ) => {
        const {cookiesFilepath: coockiesArg = DEFAULT_COOKIES_FILE, socksProxy} = getEnv();
        const cookiesFilePath = path.resolve(coockiesArg);
        if (await exists(cookiesFilePath)) {
            return new YtDlp({cookiesFilePath, socksProxy, storageDirname}, logger);
        }

        return new YtDlp({socksProxy, storageDirname}, logger);
    };

    private constructor(props: ConstructorProps, logger: winston.Logger) {
        super(props, logger, 'yt-dlp');

        return this;
    }

    private getCookiesArg() {
        return this.props.cookiesFilePath ? `--cookies ${this.props.cookiesFilePath}` : '';
    }

    private getSocksProxyArg() {
        return this.props.socksProxy ? `--proxy ${this.props.socksProxy}` : '';
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
        user,
        ...format
    }: DownloadFormatProps): Promise<Nullable<string>> {
        const userDirname = getUserDirname(user, this.props.storageDirname);
        await createDirIfNotExists(userDirname);

        const {format_id} = format;
        const formatFilename = getFormatFilename(format);
        const filePath = path.join(userDirname, `${outputFilename}.${formatFilename}`);
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
