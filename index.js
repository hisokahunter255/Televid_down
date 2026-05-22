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
        // إذا كان الرابط تيك توك
        if (url.includes('tiktok.com')) {
            const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            await ctx.replyWithVideo({ url: response.data.data.play });
        } 
        // إذا كان يوتيوب
        else {
            // نستخدم خدمة ytdl-api مباشرة للروابط العامة
            const response = await axios.get(`https://api.ytdl.is/v1/video/download?url=${encodeURIComponent(url)}`);
            await ctx.replyWithVideo({ url: response.data.url });
        }
    } catch (error) {
        console.error("Final Error:", error.message);
        ctx.reply('❌ تعذر التحميل. الخدمة قد تكون غير متاحة لهذا الفيديو حالياً.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
