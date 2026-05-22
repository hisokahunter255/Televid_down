const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ التحميل من Cobalt...');

    try {
        // نستخدم خادم Cobalt العام المباشر
        // التعديل هنا: نرسل الطلب كرابط GET بسيط لضمان التوافق
        const api = `https://co.wuk.sh/api/json`;
        const response = await axios.post(api, {
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
            ctx.reply('❌ تعذر استخراج الفيديو. جرب رابطاً آخر.');
        }
    } catch (error) {
        // هنا سنعرف السبب الحقيقي إذا كان السيرفر يرفض الطلب
        console.error("Error:", error.response ? error.response.data : error.message);
        ctx.reply('❌ فشل التحميل. قد يكون الرابط خاصاً أو محظوراً.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
