const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة الفيديو من خادم جديد...');

    try {
        // نستخدم API بديل (TikWM) يعمل حالياً للتحميل المباشر
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);

        if (response.data && response.data.data && response.data.data.play) {
            await ctx.replyWithVideo({ url: response.data.data.play });
        } else {
            ctx.reply('❌ تعذر استخراج الفيديو. جرب رابطاً آخر (تأكد أنه تيك توك أو يوتيوب).');
        }
    } catch (error) {
        ctx.reply('❌ فشل الاتصال بخادم التحميل. حاول مجدداً.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
