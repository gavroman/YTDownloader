import type {SessionState, SessionTransitionNames} from '@src/app/types';
import {FSM} from '@src/utils/fsm';

export const getFSM = (initialState: SessionState = 'idle') =>
    new FSM<SessionState, SessionTransitionNames>(initialState, {
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
