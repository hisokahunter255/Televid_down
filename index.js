    const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');

const bot = new Telegraf('8881629412:AAEzSAM_J9cCaQikgQp49GeSLiUiDyysSpw');

bot.launch();
console.log('Bot is running...');

bot.on('text', (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ Processing...');

    const filename = `video_${Date.now()}.mp4`;

    exec(`".\\yt-dlp.exe" -f "best[ext=mp4]" -o "${filename}" "${url}"`, (error) => {
        if (error) {
            console.log(error);
            return ctx.reply('❌ Error during download.');
        }

        if (fs.existsSync(filename)) {
            ctx.replyWithVideo({ source: fs.createReadStream(filename) })
                .then(() => {
                    fs.unlinkSync(filename);
                })
                .catch((err) => {
                    console.log(err);
                    ctx.reply('❌ Failed to send.');
                });
        } else {
            ctx.reply('❌ File not found.');
        }
    });
});