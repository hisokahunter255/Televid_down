const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جاري جلب الفيديو...');

    try {
        // 1. تيك توك (باستخدام TikWM - يعمل بامتياز)
        if (url.includes('tiktok.com')) {
            const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            if (response.data?.data?.play) {
                await ctx.replyWithVideo({ url: response.data.data.play });
                return;
            }
        }

        // 2. فيسبوك وانستجرام (باستخدام Cobalt - يعمل بامتياز لهما)
        if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('instagram.com')) {
            const response = await axios.post('https://api.cobalt.tools/api/json', {
                url: url,
                vQuality: "720"
            }, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            });

            if (response.data?.url) {
                await ctx.replyWithVideo({ url: response.data.url });
                return;
            }
        }

        ctx.reply('❌ للأسف لم أتمكن من التحميل، قد يكون الرابط خاصاً.');
    } catch (error) {
        ctx.reply('❌ خطأ في الاتصال، تأكد من أن الرابط عام.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Bot is running...'));
