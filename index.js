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

function extractYouTubeId(url) {
    const patterns = [
        /(?:v=)([^&\n?#]+)/,
        /youtu\.be\/([^&\n?#]+)/,
        /\/shorts\/([^&\n?#]+)/,
        /\/embed\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

async function downloadWithCobalt(url) {
    const cobaltInstances = [
        'https://cobalt.tools',
        'https://co.wuk.sh',
        'https://cobalt.flare.pw',
    ];

    for (const instance of cobaltInstances) {
        try {
            const response = await axios.post(`${instance}/api/json`,
                { url, vQuality: "720" },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            if (response.data?.url) {
                return response.data.url;
            }
        } catch (e) {
            console.log('Cobalt instance failed:', instance, e.message);
            continue;
        }
    }
    return null;
}

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

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    await ctx.reply('⏳ جارٍ المعالجة...');

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isTikTok = url.includes('tiktok.com');

    try {
        if (isYouTube || isTikTok) {
            // جرب Cobalt الأول لليوتيوب والتيكتوك
            const cobaltUrl = await downloadWithCobalt(url);
            if (cobaltUrl) {
                await ctx.replyWithVideo({ url: cobaltUrl }).catch(async () => {
                    await ctx.reply('🔗 رابط الفيديو المباشر:\n' + cobaltUrl);
                });
                return;
            }

            // fallback للتيكتوك
            if (isTikTok) {
                try {
                    const tik = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
                    if (tik.data?.data?.play) {
                        await ctx.replyWithVideo({ url: tik.data.data.play });
                        return;
                    }
                } catch {}
            }

            await ctx.reply('❌ تعذر التحميل. الرابط غير مدعوم أو خاص.');

        } else {
            const cobaltUrl = await downloadWithCobalt(url);
            if (cobaltUrl) {
                await ctx.replyWithVideo({ url: cobaltUrl }).catch(async () => {
                    await ctx.reply('🔗 رابط الفيديو المباشر:\n' + cobaltUrl);
                });
            } else {
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
