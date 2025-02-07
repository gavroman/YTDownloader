import {BotState} from '@src/types';

export const DEFAULT_STATE: BotState = 'idle';

// почти 2 гига
export const MAX_TG_FILE_LIMIT_BYTES = 2_093_796_000;

// полтора часа
export const HANDLER_TIMEOUT = 5_400_000;

export const BASE_STORAGE_DIRNAME = './video_storage';
