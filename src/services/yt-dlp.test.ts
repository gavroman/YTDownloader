// import {parseVideoFormats} from '@src/services/yt-dlp';
// import {describe, expect, it} from 'bun:test';

// const dataMock = `[youtube] Extracting URL: https://m.youtube.com/watch?v=38y_1EWIE9I
// [youtube] 38y_1EWIE9I: Downloading webpage
// [youtube] 38y_1EWIE9I: Downloading tv player API JSON
// [youtube] 38y_1EWIE9I: Downloading ios player API JSON
// [youtube] 38y_1EWIE9I: Downloading m3u8 information
// [info] Available formats for 38y_1EWIE9I:
// ID      EXT   RESOLUTION FPS CH │   FILESIZE   TBR PROTO │ VCODEC          VBR ACODEC      ABR ASR MORE INFO
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// sb3     mhtml 48x27        0    │                  mhtml │ images                                  storyboard
// sb2     mhtml 80x45        1    │                  mhtml │ images                                  storyboard
// sb1     mhtml 160x90       1    │                  mhtml │ images                                  storyboard
// sb0     mhtml 320x180      1    │                  mhtml │ images                                  storyboard
// 233     mp4   audio only        │                  m3u8  │ audio only          unknown             [en] Default
// 234     mp4   audio only        │                  m3u8  │ audio only          unknown             [en] Default
// 249     webm  audio only      2 │    1.68MiB   50k https │ audio only          opus        50k 48k [en] low, webm_dash
// 249-drc webm  audio only      2 │    1.73MiB   51k https │ audio only          opus        51k 48k [en] low, DRC, webm_dash
// 250     webm  audio only      2 │    2.25MiB   67k https │ audio only          opus        67k 48k [en] low, webm_dash
// 250-drc webm  audio only      2 │    2.27MiB   68k https │ audio only          opus        68k 48k [en] low, DRC, webm_dash
// 140     m4a   audio only      2 │    4.34MiB  130k https │ audio only          mp4a.40.2  130k 44k [en] medium, m4a_dash
// 140-drc m4a   audio only      2 │    4.35MiB  130k https │ audio only          mp4a.40.2  130k 44k [en] medium, DRC, m4a_dash
// 251     webm  audio only      2 │    4.44MiB  132k https │ audio only          opus       132k 48k [en] medium, webm_dash
// 251-drc webm  audio only      2 │    4.47MiB  133k https │ audio only          opus       133k 48k [en] medium, DRC, webm_dash
// 602     mp4   256x144     15    │ ~  2.89MiB   86k m3u8  │ vp09.00.10.08   86k video only
// 269     mp4   256x144     30    │ ~  5.67MiB  169k m3u8  │ avc1.4D400C    169k video only
// 603     mp4   256x144     30    │ ~  5.58MiB  167k m3u8  │ vp09.00.11.08  167k video only
// 229     mp4   426x240     30    │ ~ 10.38MiB  310k m3u8  │ avc1.4D4015    310k video only
// 604     mp4   426x240     30    │ ~  9.83MiB  294k m3u8  │ vp09.00.20.08  294k video only
// 230     mp4   640x360     30    │ ~ 21.40MiB  639k m3u8  │ avc1.4D401E    639k video only
// 605     mp4   640x360     30    │ ~ 20.68MiB  617k m3u8  │ vp09.00.21.08  617k video only
// 231     mp4   854x480     30    │ ~ 29.89MiB  892k m3u8  │ avc1.4D401F    892k video only
// 606     mp4   854x480     30    │ ~ 37.86MiB 1130k m3u8  │ vp09.00.30.08 1130k video only
// 232     mp4   1280x720    30    │ ~ 40.74MiB 1216k m3u8  │ avc1.4D401F   1216k video only
// 609     mp4   1280x720    30    │ ~ 67.48MiB 2015k m3u8  │ vp09.00.31.08 2015k video only
// 270     mp4   1920x1080   30    │ ~132.55MiB 3957k m3u8  │ avc1.640028   3957k video only
// 614     mp4   1920x1080   30    │ ~105.09MiB 3137k m3u8  │ vp09.00.40.08 3137k video only
// 616     mp4   1920x1080   30    │ ~189.12MiB 5646k m3u8  │ vp09.00.40.08 5646k video only          Premium
// 160     mp4   256x144     30    │    1.73MiB   52k https │ avc1.4d400c     52k video only          144p, mp4_dash
// 394     mp4   256x144     30    │    2.00MiB   60k https │ av01.0.00M.08   60k video only          144p, mp4_dash
// 278     webm  256x144     30    │    2.29MiB   68k https │ vp9             68k video only          144p, webm_dash
// 395     mp4   426x240     30    │    3.13MiB   93k https │ av01.0.00M.08   93k video only          240p, mp4_dash
// 133     mp4   426x240     30    │    3.44MiB  103k https │ avc1.4d4015    103k video only          240p, mp4_dash
// 242     webm  426x240     30    │    4.00MiB  119k https │ vp9            119k video only          240p, webm_dash
// 134     mp4   640x360     30    │    6.17MiB  184k https │ avc1.4d401e    184k video only          360p, mp4_dash
// 396     mp4   640x360     30    │    6.17MiB  184k https │ av01.0.01M.08  184k video only          360p, mp4_dash
// 243     webm  640x360     30    │    9.09MiB  271k https │ vp9            271k video only          360p, webm_dash
// 135     mp4   854x480     30    │   10.17MiB  303k https │ avc1.4d401f    303k video only          480p, mp4_dash
// 397     mp4   854x480     30    │   10.25MiB  305k https │ av01.0.04M.08  305k video only          480p, mp4_dash
// 244     webm  854x480     30    │   12.59MiB  375k https │ vp9            375k video only          480p, webm_dash
// 18      mp4   640x360     30  2 │   15.91MiB  474k https │ avc1.42001E         mp4a.40.2       44k [en] 360p
// 136     mp4   1280x720    30    │   17.70MiB  528k https │ avc1.4d401f    528k video only          720p, mp4_dash
// 398     mp4   1280x720    30    │   18.39MiB  548k https │ av01.0.05M.08  548k video only          720p, mp4_dash
// 247     webm  1280x720    30    │   22.47MiB  670k https │ vp9            670k video only          720p, webm_dash
// 399     mp4   1920x1080   30    │   30.65MiB  914k https │ av01.0.08M.08  914k video only          1080p, mp4_dash
// 248     webm  1920x1080   30    │   37.15MiB 1107k https │ vp9           1107k video only          1080p, webm_dash
// 137     mp4   1920x1080   30    │   46.12MiB 1375k https │ avc1.640028   1375k video only          1080p, mp4_dash
// `;

// describe('parseVideoFormats', () => {
//     it('parse', () => {
//         const parsed = parseVideoFormats(dataMock);

//         expect(parsed.length).toEqual(28);

//         expect(parsed).toEqual([]);
//     });
// });
