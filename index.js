const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

// وظيفة لجلب الفيديو من فيسبوك باستخدام وسيط قوي
async function getFacebookVideo(url) {
    // نستخدم خدمة FBDOWN (الأكثر توافقاً مع ريندر حالياً)
    const response = await axios.post('https://fdown.net/api/fetch-video', 
        `url=${encodeURIComponent(url)}`,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        }
    );
    // استخراج الرابط من الرد (ملاحظة: تحتاج ضبط حسب بنية الرد)
    // إذا لم ينجح، سنعود لـ Cobalt كخيار أخير
    return response.data?.url || null;
}

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جاري المعالجة الفائقة...');

    try {
        // 1. تيك توك (TikWM - لا يزال يعمل بامتياز)
        if (url.includes('tiktok.com')) {
            const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            if (res.data?.data?.play) {
                await ctx.replyWithVideo({ url: res.data.data.play });
                return;
            }
        }

        // 2. فيسبوك وانستجرام (المحاولة الأخيرة باستخدام Cobalt مع إعدادات متقدمة)
        if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('instagram.com')) {
            const res = await axios.post('https://api.cobalt.tools/api/json', {
                url: url,
                vQuality: "720",
                dubLang: true,
                disableMetadata: true
            }, {
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                    'Referer': 'https://www.facebook.com/'
                }
            });

            if (res.data?.url) {
                await ctx.replyWithVideo({ url: res.data.url });
                return;
            }
        }

        ctx.reply('❌ للأسف، السيرفر لا يزال محظوراً من فيسبوك. الرابط قد لا يكون عاماً.');
    } catch (error) {
        console.error("Critical Error:", error.message);
        ctx.reply('❌ فشل الاتصال: حاول لاحقاً أو استخدم رابطاً آخر.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Bot is running...'));
