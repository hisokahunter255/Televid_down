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

// ===== إرسال لوج للقناة =====
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

// ===== رسالة البداية =====
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

// ===== اختبار yt-dlp =====
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

// ===== ID =====
bot.command('id', async (ctx) => {

    await ctx.reply(
`🆔 Your ID:
${ctx.from.id}`
    );
});

// ===== Help =====
bot.command('help', async (ctx) => {

    await ctx.reply(
`📥 البوت يدعم:

• TikTok
• Facebook
• Instagram
• X (Twitter)
• Threads

فقط أرسل الرابط وسيتم التحميل تلقائياً`
    );
});

// ===== Admin Stats =====
bot.command('stats', async (ctx) => {

    if (ctx.from.id !== ADMIN_ID) return;

    await ctx.reply('✅ البوت يعمل حالياً');
});

// ===== تحميل الفيديو =====
async function downloadVideo(url, outputPath) {

    return new Promise((resolve, reject) => {

        const command = `
yt-dlp \
--no-playlist \
--restrict-filenames \
--no-warnings \
-f "bv*+ba/b" \
-o "${outputPath}" \
--merge-output-format mp4 \
--user-agent "Mozilla/5.0" \
"${url}"
`;

        exec(command, (error, stdout, stderr) => {

            if (error) {

                console.log(stderr);
                reject(stderr);
                return;
            }

            resolve();
        });
    });
}

// ===== إرسال الفيديو =====
async function sendVideo(ctx, filepath) {

    const stats = fs.statSync(filepath);
    const sizeMB = stats.size / 1024 / 1024;

    if (sizeMB > 49) {

        await ctx.reply(
`⚠️ الفيديو أكبر من 50MB

لا يمكن إرساله عبر تيليجرام`
        );

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

    // ===== تسجيل الاستخدام =====
    await sendLog(ctx.from, url);

    const filename = `video_${Date.now()}.mp4`;
    const filepath = path.join('/tmp', filename);

    try {

        await ctx.reply('⏳ جاري تحميل الفيديو...');

        // ===== TikTok API سريع =====
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

        // ===== yt-dlp fallback =====
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
• المنصة منعت التحميل`
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
