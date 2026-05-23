const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const express = require('express');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ المعالجة بواسطة المحرك الداخلي...');

    // استخدام yt-dlp لاستخراج رابط مباشر بدلاً من تحميل الفيديو بالكامل
    // استخدام --get-url هو الأسرع والأكثر استقراراً
    exec(`yt-dlp --get-url --format "best[ext=mp4][height<=720]" "${url}"`, (error, stdout, stderr) => {
        if (error) {
            ctx.reply('❌ فشل الاستخراج، قد يكون الفيديو مقيداً أو خاصاً.');
            console.error("yt-dlp error:", stderr);
            return;
        }

        const videoUrl = stdout.trim().split('\n')[0];
        if (videoUrl) {
            ctx.replyWithVideo({ url: videoUrl }).catch(async () => {
                ctx.reply('🔗 الرابط المباشر (يمكنك تحميله من هنا):\n' + videoUrl);
            });
        } else {
            ctx.reply('❌ تعذر الحصول على رابط صالح.');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
