const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ جلب الفيديو، انتظر قليلاً...');

    try {
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720"
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // إذا كان الرد ناجحاً
        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } else {
            ctx.reply('❌ لم أجد رابط تحميل للفيديو. جرب رابطاً آخر.');
        }
    } catch (error) {
        // إذا فشل الطلب، سنطبع الخطأ الحقيقي لنعرف السبب
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        ctx.reply('❌ فشل التحميل: ' + errorMsg);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
