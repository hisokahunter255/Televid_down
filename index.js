const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.includes('tiktok.com')) {
        ctx.reply('⚠️ هذا البوت مخصص لتحميل فيديوهات تيك توك فقط. أرسل رابط تيك توك وسأقوم بتحميله فوراً.');
        return;
    }

    ctx.reply('⏳ جارٍ جلب الفيديو...');

    try {
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        if (response.data?.data?.play) {
            await ctx.replyWithVideo({ url: response.data.data.play });
        } else {
            ctx.reply('❌ تعذر العثور على الفيديو. تأكد أن الرابط صحيح وعام.');
        }
    } catch (error) {
        ctx.reply('❌ حدث خطأ أثناء الاتصال بخادم التيك توك. حاول مرة أخرى.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('TikTok Bot is running smoothly!'));
