const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

if (process.env.WEBHOOK_URL) {
    bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);
}

bot.command('test', async (ctx) => {
    exec('yt-dlp --version', async (error, stdout, stderr) => {
        if (error) {
            await ctx.reply('❌ yt-dlp غير مثبت:\n' + stderr);
        } else {
            await ctx.reply('✅ yt-dlp مثبت: ' + stdout.trim());
        }
    });
});

async function downloadAndSend(ctx, url) {
    const filename = `video_${Date.now()}.mp4`;
    const filepath = path.join('/tmp', filename);

    return new Promise((resolve, reject) => {
        const cmd = `yt-dlp -f "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best" --merge-output-format mp4 -o "${filepath}" "${url}"`;

        exec(cmd, async (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                const stats = fs.statSync(filepath);
                const fileSizeMB = stats.size / (1024 * 1024);

                if (fileSizeMB > 50) {
                    exec(`yt-dlp -g "${url}"`, async (err, out) => {
                        fs.unlinkSync(filepath);
                        if (err) {
                            await ctx.reply('❌ الفيديو كبير جداً ولا يمكن إرساله.');
                        } else {
                            await ctx.reply('⚠️ الفيديو أكبر من 50MB، إليك الرابط المباشر:\n' + out.trim().split('\n')[0]);
                        }
                        resolve();
                    });
                } else {
                    await ctx.replyWithVideo({ source: filepath });
                    fs.unlinkSync(filepath);
                    resolve();
                }
            } catch (e) {
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                reject(e);
            }
        });
    });
}

async function downloadYouTube(ctx, url) {
    const videoId = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!videoId) {
        await ctx.reply('❌ رابط YouTube غير صحيح.');
        return;
    }

    try {
        const response = await axios.get(
            'https://youtube-media-downloader.p.rapidapi.com/v2/video/details',
            {
                params: { videoId: videoId },
                headers: {
                    'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com',
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY
                }
            }
        );

        console.log('YouTube API response:', JSON.stringify(response.data));

        const data = response.data;

        if (!data?.status) {
            await ctx.reply('❌ تعذر الحصول على بيانات الفيديو.');
            return;
        }

        const videos = data?.videos?.items || [];

        const videoFormat =
            videos.find(v => v.quality === '720p') ||
            videos.find(v => v.quality === '480p') ||
            videos.find(v => v.quality === '360p') ||
            videos[0];

        if (!videoFormat?.url) {
            console.log('No video URL in:', JSON.stringify(data));
            await ctx.reply('❌ لم يتم العثور على رابط للفيديو.');
            return;
        }

        const headRes = await axios.head(videoFormat.url).catch(() => null);
        const contentLength = headRes?.headers?.['content-length'];
        const fileSizeMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0;

        if (fileSizeMB > 50) {
            await ctx.reply('⚠️ الفيديو أكبر من 50MB، إليك الرابط المباشر:\n' + videoFormat.url);
        } else {
            await ctx.replyWithVideo({ url: videoFormat.url }).catch(async () => {
                await ctx.reply('🔗 رابط الفيديو المباشر:\n' + videoFormat.url);
            });
        }

    } catch (error) {
        console.error('YouTube error:', error?.response?.data || error.message);
        await ctx.reply('❌ تعذر تحميل الفيديو من YouTube.');
    }
}

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    await ctx.reply('⏳ جارٍ المعالجة...');

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isTikTok = url.includes('tiktok.com');

    try {
        if (isYouTube) {
            await downloadYouTube(ctx, url);

        } else if (isTikTok) {
            try {
                const tik = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
                if (tik.data?.data?.play) {
                    await ctx.replyWithVideo({ url: tik.data.data.play });
                } else {
                    throw new Error('No URL from TikWM');
                }
            } catch {
                await downloadAndSend(ctx, url);
            }

        } else {
            try {
                const response = await axios.post('https://cobalt.tools/api/json',
                    { url, vQuality: "720" },
                    { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
                );
                if (response.data?.url) {
                    await ctx.replyWithVideo({ url: response.data.url });
                } else {
                    throw new Error('No URL from Cobalt');
                }
            } catch {
                await downloadAndSend(ctx, url);
            }
        }

    } catch (error) {
        console.error(error);
        await ctx.reply('❌ تعذر التحميل. الرابط غير مدعوم أو خاص.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
