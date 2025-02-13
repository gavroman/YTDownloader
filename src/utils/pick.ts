export const pick = <T extends AnyObject, K extends keyof T>(
    obj: T,
    keys: K[],
    emptyFieldValue: any = null
): Pick<T, K> =>
    keys.reduce<Pick<T, K>>(
        (result, key) => {
            if (key in obj) {
                result[key] = obj[key];
            } else {
                result[key] = emptyFieldValue;
            }

            return result;
        },
        {} as Pick<T, K>
    );

export const omit = <T extends AnyObject, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> =>
    Object.keys(obj).reduce<Omit<T, K>>(
        (acc, key) => {
            if (!keys.includes(key as K)) {
                acc[key as Exclude<keyof T, K>] = obj[key];
            }

            return acc;
        },
        {} as Omit<T, K>
    );
