import {BotContext, DisplayFormat, MessageId, StoredMessageData} from '@src/types';

export class MessageService {
    static getMessages = async (ctx: BotContext) => ctx.session.messagesWithVideoUrls;

    static initMessages = async (ctx: BotContext) => {
        ctx.session.messagesWithVideoUrls = ctx.session.messagesWithVideoUrls || {};
    };

    static addMessage = async (ctx: BotContext, key: MessageId, message: StoredMessageData) => {
        ctx.session.messagesWithVideoUrls[key] = message;
    };

    static getMessage = async (ctx: BotContext, key: MessageId): Promise<Nullable<StoredMessageData>> =>
        ctx.session.messagesWithVideoUrls[key] || null;

    static deleteMessage = async (ctx: BotContext, key: MessageId) => {
        delete ctx.session.messagesWithVideoUrls[key];
    };

    static getFormatsByMessageId = async (
        ctx: BotContext,
        messageId: MessageId,
        {audioFormatId, videoFormatId}: {audioFormatId: string; videoFormatId: string}
    ): Promise<Nullable<DisplayFormat>> => {
        const message = await MessageService.getMessage(ctx, messageId);
        if (!message) {
            return null;
        }

        return (
            message.formats.find(
                ({audio, video}) => audio.format_id === audioFormatId && video.format_id === videoFormatId
            ) || null
        );
    };
}
