const { Telegraf } = require('telegraf');
const axios = require('axios');

// قراءة التوكن من إعدادات البيئة (Render Environment Variables)
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch();
console.log('Bot is running...');

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ جلب الفيديو، يرجى الانتظار...');

    try {
        // استخدام API الخاص بـ Cobalt للتحميل
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720",
            isAudioOnly: false,
            disableMetadata: true
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        if (data.status === 'error') {
            return ctx.reply('❌ خطأ: لم يتم العثور على الفيديو أو الرابط غير مدعوم.');
        }

        // إرسال الفيديو مباشرة باستخدام الرابط الذي وفره الـ API
        await ctx.replyWithVideo({ url: data.url });

    } catch (error) {
        console.error(error);
        ctx.reply('❌ حدث خطأ أثناء الاتصال بخادم التحميل. حاول مجدداً.');
    }
});

// هذا الجزء للحفاظ على البوت نشطاً على Render
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(process.env.PORT || 3000);
