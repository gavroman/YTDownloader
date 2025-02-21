import {BotContext, Settings} from '@src/app/types';

let SETTINGS: Settings = {
    uploadInTg: true,
};

const getSettings = async (_ctx: BotContext): Promise<Settings> => ({...SETTINGS});
const updateSettings = async (_ctx: BotContext, settings: Partial<Settings>): Promise<void> => {
    SETTINGS = {...SETTINGS, ...settings};
};

export const SettingsService = {
    getSettings,
    updateSettings,
};
