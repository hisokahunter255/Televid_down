const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة الفيديو...');

    try {
        // المحاولة الأولى: استخدام Cobalt القوي (يدعم يوتيوب وتيك توك)
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

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } 
        // المحاولة الثانية (احتياطية لتيك توك فقط)
        else if (url.includes('tiktok.com')) {
            const tiktokRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            await ctx.replyWithVideo({ url: tiktokRes.data.data.play });
        }
        else {
            ctx.reply('❌ تعذر استخراج الرابط من يوتيوب، الرابط قد يكون مقيداً.');
        }
    } catch (error) {
        console.error("Final Error:", error.message);
        ctx.reply('❌ تعذر التحميل، الخدمة قد تكون محظورة لهذا الفيديو.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
