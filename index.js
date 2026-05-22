const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch();
console.log('Bot is running...');

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة الفيديو، انتظر ثواني...');

    try {
        const response = await axios.post('https://co.wuk.sh/api/json', {
            url: url,
            vQuality: "720"
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } else {
            ctx.reply('❌ تعذر استخراج الرابط، جرب فيديو آخر.');
        }
    } catch (error) {
        console.error("Error details:", error.response ? error.response.data : error.message);
        ctx.reply('❌ حدث خطأ، تأكد من أن الرابط صحيح ومدعوم.');
    }
});

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(process.env.PORT || 3000);
