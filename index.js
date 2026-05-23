const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ جاري التحميل...');

    // نشغل الأداة مباشرة من النظام
    exec(`yt-dlp -g "${url}"`, (error, stdout, stderr) => {
        if (error) {
            ctx.reply('❌ تعذر التحميل. جرب رابطاً آخر.');
            return;
        }
        const link = stdout.trim().split('\n')[0];
        if (link) {
            ctx.replyWithVideo({ url: link }).catch(() => {
                ctx.reply('🔗 إليك الرابط المباشر:\n' + link);
            });
        } else {
            ctx.reply('❌ لم يتم العثور على رابط.');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Bot is running...'));
