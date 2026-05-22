const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جاري التحميل...');

    try {
        // نستخدم خدمة API بديلة قوية
        const response = await axios.get(`https://api.snapvid.xyz/api?url=${encodeURIComponent(url)}`);

        // نطبع الرد في الـ Logs لنرى ماذا يرسل الموقع (للتصحيح)
        console.log("API Response:", JSON.stringify(response.data));

        if (response.data && response.data.video) {
            await ctx.replyWithVideo({ url: response.data.video });
        } else {
            ctx.reply('❌ لم أستطع العثور على رابط التحميل. جرب فيديو آخر.');
        }
    } catch (error) {
        ctx.reply('❌ خطأ في الاتصال بالسيرفر.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
