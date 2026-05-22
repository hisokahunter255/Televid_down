const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ التحميل...');

    // استخدام yt-dlp لاستخراج الرابط المباشر
    // --get-url هي الخاصية الأقوى لاستخراج رابط الفيديو المباشر
    exec(`yt-dlp --get-url "${url}"`, (error, stdout, stderr) => {
        if (error) {
            ctx.reply('❌ تعذر التحميل. الرابط غير مدعوم أو خاص.');
            return;
        }
        
        const videoUrl = stdout.trim();
        if (videoUrl) {
            ctx.replyWithVideo({ url: videoUrl }).catch(() => {
                ctx.reply('الفيديو متاح عبر هذا الرابط:\n' + videoUrl);
            });
        } else {
            ctx.reply('❌ لم يتم العثور على رابط صالح.');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
