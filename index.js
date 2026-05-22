const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

// إضافة هذا السطر لمنع تضارب الـ Webhooks/Polling
bot.launch({ dropPendingUpdates: true });
console.log('Bot is running...');

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url || !url.startsWith('http')) return;

    ctx.reply('⏳ جارٍ معالجة الفيديو...');

    try {
        // رابط API بديل ومستقر
        const response = await axios.post('https://cobalt.api.leah.codes/api/json', {
            url: url,
            vQuality: "720"
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.url) {
            await ctx.replyWithVideo({ url: response.data.url });
        } else {
            ctx.reply('❌ تعذر استخراج الفيديو.');
        }
    } catch (error) {
        console.error("Error details:", error.message);
        ctx.reply('❌ حدث خطأ، حاول مجدداً.');
    }
});

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(process.env.PORT || 3000);
