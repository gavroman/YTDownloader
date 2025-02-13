import {execSync} from 'child_process';
// stderr is sent to stderr of parent process
// you can set options.stdio if you want it to go elsewhere
const stdout = execSync(
    'yt-dlp --proxy socks5://tgbot:ytdownloader@89.110.106.237:6875 --verbose -S filesize --list-formats "https://www.youtube.com/watch?v=k286iLrwTxw"'
);
// const stdout = execSync('yt-dlp --proxy socks5://tgbot:ytdownloader@89.110.106.237:6875 --verbose -S filesize --list-formats "https://www.youtube.com/watch?v=k286iLrwTxw"');
console.log(stdout.toString());
