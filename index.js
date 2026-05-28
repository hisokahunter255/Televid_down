const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ADMIN_ID = Number(process.env.ADMIN_ID);
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

if (WEBHOOK_URL) {
    bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`);
}

// ===== إرسال اللوج =====
async function sendLog(user, url) {

    try {

        const text =
`📥 استخدام جديد

👤 الاسم: ${user.first_name || 'Unknown'}
🆔 ID: ${user.id}
📎 Username: @${user.username || 'none'}

🔗 الرابط:
${url}

🕒 ${new Date().toLocaleString()}
`;

        await bot.telegram.sendMessage(LOG_CHANNEL_ID, text);

    } catch (e) {

        console.log('Log Error:', e.message);
    }
}

// ===== Start =====
bot.start(async (ctx) => {

    await ctx.reply(
`👋 أهلاً بك

أرسل رابط فيديو من:

• TikTok
• Facebook
• Instagram
• X (Twitter)
• Threads

وسيتم تحميله تلقائياً`
    );
});

// ===== Test =====
bot.command('test', async (ctx) => {

    exec('yt-dlp --version', async (error, stdout) => {

        if (error) {

            await ctx.reply('❌ yt-dlp غير مثبت');
            return;
        }

        await ctx.reply(`✅ yt-dlp version:\n${stdout}`);
    });
});

// ===== Ping =====
bot.command('ping', async (ctx) => {

    await ctx.reply('🏓 البوت يعمل بنجاح');
});

// ===== Help =====
bot.command('help', async (ctx) => {

    await ctx.reply(
`📥 البوت يدعم:

• TikTok
• Facebook
• Instagram
• X (Twitter)
• Threads`
    );
});

// ===== تحميل الفيديو =====
async function downloadVideo(url, outputPath) {

    return new Promise((resolve, reject) => {

        const isThreads = url.includes('threads.net');
        const isInstagram = url.includes('instagram.com');

        let command = '';

        // ===== Threads + Instagram =====
        if (isThreads || isInstagram) {

            command = `
yt-dlp \
--no-playlist \
--no-warnings \
--restrict-filenames \
--add-header "User-Agent: Mozilla/5.0" \
--add-header "Accept-Language: en-US,en;q=0.9" \
-f "bv*+ba/b" \
--merge-output-format mp4 \
-o "${outputPath}" \
"${url}"
`;
        }

        // ===== باقي المواقع =====
        else {

            command = `
yt-dlp \
--no-playlist \
--no-warnings \
--restrict-filenames \
-f "bv*+ba/b" \
--merge-output-format mp4 \
-o "${outputPath}" \
"${url}"
`;
        }

        console.log('Running command:\n', command);

        exec(command, (error, stdout, stderr) => {

            if (error) {

                console.log('YT-DLP ERROR:\n', stderr);

                reject(stderr);
                return;
            }

            console.log('YT-DLP SUCCESS');

            resolve();
        });
    });
}

// ===== إرسال الفيديو =====
async function sendVideo(ctx, filepath) {

    const stats = fs.statSync(filepath);
    const sizeMB = stats.size / 1024 / 1024;

    if (sizeMB > 49) {

        await ctx.reply('⚠️ الفيديو أكبر من 50MB');

        return;
    }

    await ctx.replyWithVideo({
        source: filepath
    });
}

// ===== استقبال الرسائل =====
bot.on('text', async (ctx) => {

    const url = ctx.message.text.trim();

    if (!url.startsWith('http')) {
        return;
    }

    const isSupported =
        url.includes('tiktok.com') ||
        url.includes('instagram.com') ||
        url.includes('facebook.com') ||
        url.includes('fb.watch') ||
        url.includes('twitter.com') ||
        url.includes('x.com') ||
        url.includes('threads.net');

    if (!isSupported) {

        await ctx.reply(
`❌ الموقع غير مدعوم

✅ المدعوم:
• TikTok
• Facebook
• Instagram
• X (Twitter)
• Threads`
        );

        return;
    }

    await sendLog(ctx.from, url);

    const filename = `video_${Date.now()}.mp4`;
    const filepath = path.join('/tmp', filename);

    try {

        await ctx.reply('⏳ جاري تحميل الفيديو...');

        // ===== TikTok API =====
        if (url.includes('tiktok.com')) {

            try {

                const response = await axios.get(
                    `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
                );

                if (response.data?.data?.play) {

                    await ctx.replyWithVideo({
                        url: response.data.data.play
                    });

                    return;
                }

            } catch (e) {

                console.log('TikWM failed');
            }
        }

        // ===== yt-dlp =====
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
• Instagram / Threads يحتاج تسجيل دخول`
        );
    }
});

// ===== الصفحة الرئيسية =====
app.get('/', (req, res) => {

    res.send('Bot is running');
});

// ===== تشغيل السيرفر =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});
