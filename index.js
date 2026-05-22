const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة طلبك...');

    try {
        // نستخدم خدمة API مجانية ومستقرة للروابط
        const response = await axios.get(`https://api.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        
        if (response.data && response.data.data && response.data.data.play) {
            await ctx.replyWithVideo({ url: response.data.data.play });
        } else {
            ctx.reply('❌ لم أجد رابط تحميل صالح. جرب رابط تيك توك.');
        }
    } catch (error) {
        ctx.reply('❌ خطأ في الاتصال بالسيرفر. حاول لاحقاً.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
