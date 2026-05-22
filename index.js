const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch({ dropPendingUpdates: true });
console.log('Bot is running...');

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة الفيديو، انتظر ثواني...');

    try {
        // نستخدم API خدمة Cobalt الرسمية
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720"
        }, {
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' 
            }
        });

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } else if (response.data && response.data.status === 'picker') {
            ctx.reply('⚠️ الفيديو يحتوي على عدة خيارات، أرسل الرابط مرة أخرى أو جرب رابطاً مباشراً.');
        } else {
            ctx.reply('❌ تعذر استخراج الفيديو، الرابط غير مدعوم.');
        }
    } catch (error) {
        console.error("Error details:", error.response ? error.response.data : error.message);
        ctx.reply('❌ حدث خطأ، تأكد من أن الرابط عام وليس خاصاً.');
    }
});

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(process.env.PORT || 3000);
