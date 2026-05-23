const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جاري جلب الفيديو، يرجى الانتظار...');

    try {
        // 1. تيك توك (TikWM - الأكثر استقراراً)
        if (url.includes('tiktok.com')) {
            const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            if (response.data?.data?.play) {
                await ctx.replyWithVideo({ url: response.data.data.play });
                return;
            }
        }

        // 2. فيسبوك (ريلز) وانستجرام (Cobalt مع التمويه الذكي)
        if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('instagram.com')) {
            const response = await axios.post('https://api.cobalt.tools/api/json', {
                url: url,
                vQuality: "720"
            }, {
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.google.com/' 
                }
            });

            if (response.data?.url) {
                await ctx.replyWithVideo({ url: response.data.url });
                return;
            } else if (response.data?.picker) {
                // في حال وجود خيارات متعددة
                await ctx.replyWithVideo({ url: response.data.picker[0].url });
                return;
            }
        }

        ctx.reply('❌ للأسف لم أتمكن من التحميل، جرب رابطاً آخر أو تأكد أن الفيديو عام.');
    } catch (error) {
        console.error("Error:", error.message);
        ctx.reply('❌ خطأ في الاتصال بالسيرفر. الموقع قد يكون حظر طلبات البوت.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Bot is running successfully!'));
