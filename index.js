const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ المعالجة...');

    try {
        // نستخدم الـ API الرسمي لخدمة Cobalt
        // هو الخادم الوحيد الذي يمتلك ملفات Cookies جاهزة على سيرفراتهم
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720",
            downloadMode: "auto"
        }, {
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } else {
            ctx.reply('❌ تعذر استخراج الرابط من يوتيوب. قد يكون الفيديو محظوراً أو خاصاً.');
        }
    } catch (error) {
        // إذا فشل Cobalt، سنعطيك رابطاً يدوياً للتحميل
        ctx.reply('❌ يوتيوب يتطلب صلاحيات خاصة حالياً. يمكنك التحميل يدوياً من الرابط: ' + url);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
