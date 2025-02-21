export const parseCallbackDataType = (input: string): Nullable<string> => {
    try {
        const {actionType} = JSON.parse(input);

        return actionType;
    } catch (_e) {
        return null;
    }
};
