const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

if (WEBHOOK_URL) {
    bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`);
}

bot.start(async (ctx) => {
    await ctx.reply(
`👋 أرسل رابط الفيديو من:

• TikTok
• Facebook
• Instagram
• X (Twitter)

وسيتم تحميله تلقائياً`
    );
});

bot.command('test', async (ctx) => {
    exec('yt-dlp --version', async (error, stdout, stderr) => {
        if (error) {
            await ctx.reply('❌ yt-dlp غير مثبت');
            return;
        }

        await ctx.reply(`✅ yt-dlp version: ${stdout}`);
    });
});

async function downloadVideo(url, outputPath) {

    return new Promise((resolve, reject) => {

        const command = `
yt-dlp \
--no-playlist \
--no-warnings \
--restrict-filenames \
-f "mp4/best" \
-o "${outputPath}" \
--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
"${url}"
`;

        exec(command, async (error, stdout, stderr) => {

            if (error) {
                console.log(stderr);
                reject(stderr);
                return;
            }

            resolve();
        });
    });
}

async function sendVideo(ctx, filePath) {

    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / 1024 / 1024;

    if (sizeMB > 49) {

        await ctx.reply('⚠️ الفيديو أكبر من الحد المسموح به في تيليجرام');
        return;
    }

    await ctx.replyWithVideo({
        source: filePath
    });
}

bot.on('text', async (ctx) => {

    const url = ctx.message.text.trim();

    if (!url.startsWith('http')) {
        return;
    }

    const supported =
        url.includes('tiktok.com') ||
        url.includes('instagram.com') ||
        url.includes('facebook.com') ||
        url.includes('fb.watch') ||
        url.includes('x.com') ||
        url.includes('twitter.com');

    if (!supported) {

        await ctx.reply(
`❌ الموقع غير مدعوم

✅ المدعوم:
• TikTok
• Facebook
• Instagram
• X`
        );

        return;
    }

    const filename = `video_${Date.now()}.mp4`;
    const filepath = path.join('/tmp', filename);

    try {

        await ctx.reply('⏳ جاري التحميل...');

        // TikTok API سريع
        if (url.includes('tiktok.com')) {

            try {

                const tikwm = await axios.get(
                    `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
                );

                if (tikwm.data?.data?.play) {

                    await ctx.replyWithVideo({
                        url: tikwm.data.data.play
                    });

                    return;
                }

            } catch (e) {
                console.log('TikWM failed');
            }
        }

        // fallback yt-dlp
        await downloadVideo(url, filepath);

        if (!fs.existsSync(filepath)) {
            throw new Error('File not found');
        }

        await sendVideo(ctx, filepath);

        fs.unlinkSync(filepath);

    } catch (error) {

        console.log(error);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        await ctx.reply(
`❌ فشل تحميل الفيديو

الأسباب المحتملة:
• الرابط خاص
• المحتوى محمي
• Instagram/Facebook يحتاج تسجيل دخول
• السيرفر يمنع التحميل`
        );
    }
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running');
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
