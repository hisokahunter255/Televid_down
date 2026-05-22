const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// التوكن يُقرأ من إعدادات Render (Environment Variables)
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch();
console.log('Bot is running...');

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    // التأكد أن الرسالة رابط
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة الفيديو، انتظر ثواني...');

    try {
        // نستخدم API التحويل
        const response = await axios.get(`https://api.douyin.wtf/api?url=${encodeURIComponent(url)}`);
        
        // استخراج رابط الفيديو من الرد
        const videoUrl = response.data.video_data?.nwm_video_url_HQ || response.data.video_data?.nwm_video_url;

        if (videoUrl) {
            await ctx.replyWithVideo({ url: videoUrl });
        } else {
            ctx.reply('❌ لم أتمكن من استخراج الفيديو، الرابط قد لا يكون مدعوماً.');
        }
    } catch (error) {
        console.error(error);
        ctx.reply('❌ حدث خطأ أثناء الاتصال بخادم التحميل، حاول مجدداً.');
    }
});

// سيرفر بسيط لإبقاء البوت نشطاً على Render (مهم جداً)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(process.env.PORT || 3000);
