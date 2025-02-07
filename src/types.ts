import {S3} from '@src/services/s3';
import type {FSM} from '@src/utils/fsm';
import type {Context, NarrowedContext} from 'telegraf';
import type {CallbackQuery, Message, Update} from 'telegraf/types';

export type BotState = 'idle' | 'waitForQuality' | 'downloading';

export type BotTransitionNames = 'formatsListed' | 'qualitySelected' | 'videoDownloaded';

export type MessageId = number | string;

export type Format = {
    format_id: string;
    format: string;
    format_note: string;
    ext: string;
    protocol: string;
    width: number;
    height: number;
    audio_ext: Nullable<string>;
    video_ext: Nullable<string>;
    vbr: number;
    abr: number;
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

export type Session = {state: BotState; messagesWithVideoUrls: MessageStorage};

export type BotContext = {
    session: Session;
    fsm: FSM<BotState, BotTransitionNames>;
    S3?: S3;
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
