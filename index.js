const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// إعداد الـ Webhook للتعامل مع الرسائل بشكل صحيح
app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة الفيديو...');

    try {
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720"
        }, {
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' 
            }
        });

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } else {
            ctx.reply('❌ تعذر استخراج الرابط.');
        }
    } catch (error) {
        console.error("Error:", error.message);
        ctx.reply('❌ حدث خطأ، تأكد من أن الرابط عام.');
    }
});

// تشغيل السيرفر على البورت المطلوب
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot is running on port ${PORT}`);
});
