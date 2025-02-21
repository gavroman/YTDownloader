import {Logger} from 'winston';

export type ServiceAsyncInitFn<TInitProps, TService> = (
    logger: Logger,
    props: TInitProps,
) => Promise<TService>;

export abstract class AbstractService<TProps> {
    protected readonly logger: Logger;

    constructor(
        protected readonly props: TProps,
        logger: Logger,
        logModuleName: string,
    ) {
        this.logger = logger.child({module: logModuleName});
        logger.verbose('Service init', {props});
    }
}
