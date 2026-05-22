const { Telegraf } = require('telegraf');
const ytdl = require('ytdl-core'); // تأكد أنها مثبتة في package.json
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!ytdl.validateURL(url)) {
        return ctx.reply('❌ الرابط غير مدعوم أو غير صالح.');
    }

    ctx.reply('⏳ جاري التحميل...');

    try {
        const info = await ytdl.getInfo(url);
        const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });

        if (videoFormat && videoFormat.url) {
            await ctx.replyWithVideo({ url: videoFormat.url });
        } else {
            ctx.reply('❌ تعذر العثور على رابط تحميل مباشر.');
        }
    } catch (error) {
        ctx.reply('❌ خطأ في التحميل: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
