export const getRepeater = (interval: number, limit: number) => {
    let timer: Nullable<Timer> = null;

    return (fn: (i: number) => void) => {
        clearInterval(timer || 0);
        let counter = 0;
        fn(counter);

        timer = setInterval(() => {
            console.log('repeat i');
            counter++;
            fn(counter);
            if (counter > limit) {
                clearInterval(timer || 0);
            }
        }, interval);

        return () => clearInterval(timer || 0);
    };
};
