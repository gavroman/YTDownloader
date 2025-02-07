import type {BotState, BotTransitionNames} from '@src/types';
import {FSM} from '@src/utils/fsm';

export const getFSM = (initialState: BotState = 'idle') =>
    new FSM<BotState, BotTransitionNames>(initialState, {
        formatsListed: {
            from: 'idle',
            to: 'waitForQuality',
        },
        qualitySelected: {
            from: 'waitForQuality',
            to: 'downloading',
        },
        videoDownloaded: {
            from: 'downloading',
            to: 'idle',
        },
    });
