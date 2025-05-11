import type {FSM} from '@src/utils/fsm';
import type {Context, NarrowedContext} from 'telegraf';
import type {CallbackQuery, Message, Update} from 'telegraf/types';
import winston from 'winston';

export type SessionState = 'idle' | 'waitForQuality' | 'downloading';

export type SessionTransitionNames = 'formatsListed' | 'qualitySelected' | 'videoDownloaded';

export type MessageId = number | string;

export type Format = {
    format_id: string;
    format: string;
    format_note: Nullable<string>;
    ext: string;
    protocol: string;
    width: number;
    height: number;
    audio_ext: Nullable<string>;
    video_ext: Nullable<string>;
    vbr: number;
    abr: number;
    vcodec: string;
    acodec: string;
    tbr: number;
    filesize: number;
    filesizeHumanReadable: Nullable<string>;
    quality: number;
};
export type DisplayFormat = {audio: Format; video: Format};

export type StoredMessageData = {
    videoUrl: string;
    videoTitle: string;
    videoDuration: string;
    formats: DisplayFormat[];
};

export type MessageStorage = Record<MessageId, StoredMessageData>;

export type Session = {state: SessionState; messagesWithVideoUrls: MessageStorage};

export type Settings = {uploadInTg: boolean};

export type BotContext = {
    session: Session;
    fsm: FSM<SessionState, SessionTransitionNames>;
    logger: winston.Logger;
    settings: Settings;
} & Context;

export type BotMessageContext = NarrowedContext<
    BotContext,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Update.MessageUpdate<Record<'text', {}> & Message.TextMessage>
>;

export type BotCallbackDataContext = NarrowedContext<
    BotContext,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Update.CallbackQueryUpdate<Record<'data', {}> & CallbackQuery.DataQuery>
>;

export type NextFn = () => Promise<void>;

export type CloudStoredFile = {
    name: string;
    size: number;
    lastModified: Date;
    url: string;
};
