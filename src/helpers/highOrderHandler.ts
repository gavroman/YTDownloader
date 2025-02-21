import {BotContext, NextFn} from '@src/app/types';

type AsyncHandler<T> = (...args: any[]) => Promise<T>;

export const asyncHandler =
    <T>(handler: AsyncHandler<T>): AsyncHandler<void> =>
    async (...args) => {
        handler(...args);
    };

type Handler<C extends BotContext, TResult = void> = (ctx: C, next?: NextFn) => Promise<TResult>;

export const withAuthCheck =
    <C extends BotContext, TResult>(handler: Handler<C, TResult>): Handler<C, TResult | void> =>
    async (ctx: C, next?: NextFn) => {
        if (ctx.from?.username === '') {
            return next?.();
        }

        return handler(ctx, next);
    };
