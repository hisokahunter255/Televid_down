const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ المعالجة، انتظر قليلاً...');

    try {
        // المحاولة الأولى: استخدام Cobalt مع تعريف متصفح حقيقي لتجاوز قيود يوتيوب
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720",
            downloadMode: "auto"
        }, {
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } 
        // المحاولة الثانية: إذا كان تيك توك ولم ينجح Cobalt
        else if (url.includes('tiktok.com')) {
            const tiktokRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            await ctx.replyWithVideo({ url: tiktokRes.data.data.play });
        }
        else {
            ctx.reply('❌ تعذر التحميل، الرابط قد يكون خاصاً أو يوتيوب قام بحظر الطلب.');
        }
    } catch (error) {
        console.error("Final Error:", error.message);
        ctx.reply('❌ تعذر التحميل. الخدمة قد تكون غير متاحة حالياً لهذا الفيديو.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
