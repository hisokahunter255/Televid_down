const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch();
console.log('Bot is running...');

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة الفيديو...');

    try {
        // نستخدم API خدمة Cobalt المجانية والقوية للتحميل
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720",
            filenameStyle: "classic"
        }, {
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' 
            }
        });

        // الـ API سيرد برابط مباشر للفيديو
        const downloadUrl = response.data.url;

        if (downloadUrl) {
            await ctx.replyWithVideo({ url: downloadUrl });
        } else {
            ctx.reply('❌ تعذر الحصول على رابط التحميل.');
        }
    } catch (error) {
        console.error(error);
        ctx.reply('❌ حدث خطأ، يرجى التأكد من أن الرابط صحيح.');
    }
});

// إبقاء البوت نشطاً لـ Render
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(process.env.PORT || 3000);
