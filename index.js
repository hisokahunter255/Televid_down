const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ الاتصال بخادم التحميل...');

    try {
        // نستخدم API خدمة Cobalt الرسمية مع إضافة Header يخدع المواقع
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720",
            filenameStyle: "basic"
        }, {
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                // المفتاح السحري: إيهام الموقع بأن الطلب من متصفح حقيقي في دبي أو القاهرة
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://cobalt.tools/'
            }
        });

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } else {
            ctx.reply('❌ لم يتمكن الخادم من استخراج الرابط. الفيديو قد يكون خاصاً.');
        }
    } catch (error) {
        // طباعة تفاصيل الخطأ للـ Logs
        console.error("Error Detail:", error.response ? error.response.data : error.message);
        ctx.reply('❌ فشل الطلب: ' + (error.response?.data?.text || "الخادم يرفض الاتصال"));
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
