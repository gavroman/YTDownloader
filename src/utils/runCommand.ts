import {exec} from 'child_process';

export const runCommand = async (command: string): Promise<string> =>
    new Promise((resolve, reject) => {
        console.log(`Running command: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(stderr);
                return reject(error);
            }
            resolve(stdout);
        });
    });
