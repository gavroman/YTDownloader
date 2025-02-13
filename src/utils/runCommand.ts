import {exec} from 'child_process';

export const runCommand = async (command: string): Promise<string> =>
    new Promise((resolve, reject) => {
        exec(command, (error, stdout) => {
            if (error) {
                return reject(error);
            }
            resolve(stdout);
        });
    });
