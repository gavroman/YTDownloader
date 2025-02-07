import {$} from 'bun';
import path from 'path';

export class FFMPEG {
    static async $mergeAudioAndVideo(audioFullPath: string, videoFullPath: string, filename: string) {
        const outputFilenameFullPath = path.resolve(videoFullPath, `../${filename}`);

        console.log('outputFilenameFullPath', outputFilenameFullPath);
        await $`ffmpeg -i ${videoFullPath} -i ${audioFullPath} -vcodec copy -acodec copy ${outputFilenameFullPath}`;

        return outputFilenameFullPath;
    }
}
