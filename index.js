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

    ctx.reply('⏳ جارٍ المعالجة... (هذا قد يستغرق لحظات)');

    // تحميل yt-dlp محلياً في كل مرة لضمان التوافق
    const downloadCmd = `python3 -m pip install -U yt-dlp && python3 -m yt_dlp -g --format "best[ext=mp4][height<=720]" "${url}"`;

    exec(downloadCmd, (error, stdout, stderr) => {
        if (error) {
            ctx.reply('❌ تعذر التحميل: الرابط لا يدعم التحميل المباشر.');
            return;
        }

        const videoUrl = stdout.trim().split('\n')[0];
        if (videoUrl) {
            ctx.replyWithVideo({ url: videoUrl }).catch(() => {
                ctx.reply('🔗 الرابط المباشر:\n' + videoUrl);
            });
        } else {
            ctx.reply('❌ لم يتم العثور على رابط صالح.');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Bot running...'));
