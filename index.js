const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ تحويل الرابط...');

    try {
        // نستخدم API خدمة Cobalt المحدثة (co.wuk.sh)
        const response = await axios.post('https://co.wuk.sh/api/json', {
            url: url,
            vQuality: "720"
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } else {
            ctx.reply('❌ تعذر استخراج الرابط، جرب فيديو آخر.');
        }
    } catch (error) {
        ctx.reply('❌ فشل الاتصال بخدمة التحويل، السيرفر قد يكون مشغولاً.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
