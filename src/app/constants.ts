import {SessionState} from '@src/app/types';

export const DEFAULT_STATE: SessionState = 'idle';

// почти 2 гига
export const MAX_TG_FILE_LIMIT_BYTES = 2_093_796_000;

// полтора часа
export const HANDLER_TIMEOUT = 5_400_000;

export const MAX_CHARS_IN_MESSAGE = 4000;

export const BASE_STORAGE_DIRNAME = './video_storage';

export const FILTERED_FORMAT_FIELDS = [
    'format_id',
    'format',
    'format_note',
    'ext',
    'protocol',
    'width',
    'height',
    'audio_ext',
    'video_ext',
    'vbr',
    'abr',
    'vcodec',
    'acodec',
    'tbr',
    'filesize',
    'quality',
];
