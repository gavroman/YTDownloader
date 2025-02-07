export type Dimensions = {width: number; height: number};

export function getResolution(arg1: number, arg2: number): string;
export function getResolution(arg1: Dimensions): string;
// eslint-disable-next-line func-style
export function getResolution(arg1: Dimensions | number, arg2?: number): string {
    const dimensions = arg2 ? [arg1, arg2] : [(arg1 as Dimensions).width, (arg1 as Dimensions).height];

    return dimensions.join('x');
}
