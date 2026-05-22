const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جاري التحميل باستخدام yt-dlp...');

    // استخدام yt-dlp لاستخراج رابط الفيديو المباشر
    exec(`yt-dlp -g "${url}"`, (error, stdout, stderr) => {
        if (error) {
            ctx.reply('❌ فشل استخراج الرابط. تأكد أن الرابط عام.');
            return;
        }
        
        const videoUrl = stdout.trim();
        if (videoUrl) {
            ctx.replyWithVideo({ url: videoUrl }).catch(() => {
                ctx.reply('الفيديو كبير جداً، إليك الرابط المباشر:\n' + videoUrl);
            });
        } else {
            ctx.reply('❌ لم أجد رابطاً.');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
