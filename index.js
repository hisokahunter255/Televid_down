const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch();
console.log('Bot is running...');

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ تحويل الرابط، انتظر قليلاً...');

    try {
        // نستخدم API بديل يعمل بكفاءة للتحميل
        const response = await axios.get(`https://api.douyin.wtf/api?url=${encodeURIComponent(url)}`);
        
        const videoUrl = response.data.video_data.nwm_video_url_HQ || response.data.video_data.nwm_video_url;

        if (videoUrl) {
            await ctx.replyWithVideo({ url: videoUrl });
        } else {
            ctx.reply('❌ لم أتمكن من استخراج الفيديو، حاول رابطاً آخر.');
        }
    } catch (error) {
        console.error(error);
        ctx.reply('❌ حدث خطأ في الاتصال بخادم التحميل.');
    }
});

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(process.env.PORT || 3000);
