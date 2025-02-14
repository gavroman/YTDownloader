type AsyncHandler<T> = (...args: any[]) => Promise<T>;

export const asyncHandler =
    <T>(handler: AsyncHandler<T>): AsyncHandler<void> =>
    async (...args) => {
        handler(...args);
    };
