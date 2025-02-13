// import {YtDlp} from '@src/services/yt-dlp';

// const url = 'https://www.youtube.com/watch?v=k286iLrwTxw';

// describe('YtDlp', () => {
//     let yt: YtDlp;
//     beforeEach(async () => {
//         yt = await YtDlp.init({username: 'testusername', id: 234});
//     });

//     it('init', () => {
//         expect(yt).toBeDefined();
//     });

//     it('getVideoInfo', async () => {
//         const result = await yt.$getVideoInfo(url);

//         console.log('result', result);

//         expect(result.title).toBeDefined();
//         expect(result.formats).toBeArray();
//     });
// });
