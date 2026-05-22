const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ المعالجة...');

    try {
        // نستخدم الرابط الرسمي والمستقر حالياً
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
            ctx.reply('❌ تعذر استخراج الفيديو.');
        }
    } catch (error) {
        // في حال فشل Cobalt، نجرب الطريقة البديلة المباشرة (TikWM)
        if (url.includes('tiktok.com')) {
            const tik = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            await ctx.replyWithVideo({ url: tik.data.data.play });
        } else {
            ctx.reply('❌ تعذر التحميل، الرابط قد لا يكون مدعوماً.');
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
