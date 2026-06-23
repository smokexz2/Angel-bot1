const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const { configuracao, produtos, BackupStorag, BackupStorage } = require("../../database");
const { SincronizarDados, SalvarTemplate } = require('../../Functions/SincronizarDados');
const { BackupFunction, description } = require('../../ComandosSlash/Administracao/backup');
const { default: axios } = require('axios');
const emojis = require("../../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

function generateTimestamp() {
    const currentTimestamp = Date.now();  
    const futureTimestamp = currentTimestamp + 2 * 60 * 1000;  
    return Math.floor(futureTimestamp / 1000);  
}


const timestamp = generateTimestamp();

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.isButton()) {
            if (interaction.customId === 'sincronizardados') {
                await interaction.update({ content: `${Emojis.get(`loading`)} Aguarde...`, components: [], flags: 64 });
                await SincronizarDados(client);
                await BackupFunction(client, interaction);
            }
            if (interaction.customId === 'salvartemplate') {
                await interaction.update({ content: `${Emojis.get(`loading`)} Salvando o template aguarde <t:${timestamp}:R> para usar o comando novamente...`, components: [], flags: 64 });
                await SalvarTemplate(client);
                await BackupFunction(client, interaction);
            }
            if (interaction.customId === 'apagarbackup') {
                await interaction.update({ content: `${Emojis.get(`loading`)} Aguarde...`, components: [], flags: 64 });
                let opcoes = []
                let backups = BackupStorage.fetchAll();

                for (const key in backups) {
                    const element = backups[key];
                    opcoes.push({
                        label: `Nome: ${element.data[0].name} ID: ${element.ID?.startsWith(`Template_`) ? `template_` : ``}${element.data[0].id}`,
                        description: `Canais: ${element.data[0].channels.length} Cargos: ${element.data[0].roles.length}`,
                        emoji: `${Emojis.get(`ecloud`)}`,
                        value: element.ID
                    })
                }

                const select = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('apagarbackup')
                        .setPlaceholder('Clique aqui para ver os backups')
                        .addOptions(opcoes)
                )

                await interaction.editReply({ content: ``, components: [select], flags: 64 });
            }
            if (interaction.customId === 'restaurarservidor') {
                await interaction.update({ content: `${Emojis.get(`loading`)} Aguarde...`, components: [], flags: 64 });
                let opcoes = []
                let backups = BackupStorage.fetchAll();

                for (const key in backups) {
                    const element = backups[key];
                    opcoes.push({
                        label: `Nome: ${element.data[0].name} ID: ${element.ID?.startsWith(`Template_`) ? `template_` : ``}${element.data[0].id}`,
                        description: `Canais: ${element.data[0].channels.length} Cargos: ${element.data[0].roles.length}`,
                        emoji: `${Emojis.get(`ecloud`)}`,
                        value: element.ID
                    })
                }

                const select = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('restaurarservidor')
                        .setPlaceholder('Clique aqui para ver os backups')
                        .addOptions(opcoes)
                )

                await interaction.editReply({ content: ``, components: [select], flags: 64 });
            }
        }
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'apagarbackup') {
                const modal = new ModalBuilder()
                    .setTitle(`Apagando o backup`)
                    .setCustomId(`apagarbackup_${interaction.values[0]}`)

                const confirmacao = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`confirmacao`)
                        .setLabel(`CONFIRMAÇÃO`)
                        .setPlaceholder(`Ao digitar "sim" o processo iniciará`)
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(3)
                        .setRequired(true)
                )
                modal.addComponents(confirmacao);
                await interaction.showModal(modal);
            }
            if (interaction.customId === 'restaurarservidor') {
                const modal = new ModalBuilder()
                    .setTitle(`Restaurando o backup`)
                    .setCustomId(`restaurarservidor_${interaction.values[0]}`)

                const confirmacao = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`confirmacao`)
                        .setLabel(`CONFIRMAÇÃO`)
                        .setPlaceholder(`Ao digitar "sim" o processo iniciará`)
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(3)
                        .setRequired(true)
                )
                modal.addComponents(confirmacao);
                await interaction.showModal(modal);
            }
        }
        if (interaction.type === InteractionType.ModalSubmit) {
            if (interaction.customId.startsWith(`apagarbackup_`)) {
                const confirmacao = interaction.fields.getTextInputValue(`confirmacao`);
                if (confirmacao.toLowerCase() !== `sim`) {
                    await interaction.update({ content: `${Emojis.get(`negative`)} Processo cancelado.`, components: [], flags: 64 });
                    setTimeout(() => {
                        BackupFunction(client, interaction);
                    }, 1000);
                    return;
                }

                BackupStorage.delete(`${interaction.customId.split(`_`)[1]}_${interaction.customId.split(`_`)[2]}`);
                await interaction.update({ content: `${Emojis.get(`checker`)} Backup apagado com sucesso.`, components: [], flags: 64 });
                setTimeout(() => {
                    BackupFunction(client, interaction);
                }, 1000);
            }
            if (interaction.customId.startsWith(`restaurarservidor_`)) {
                const confirmacao = interaction.fields.getTextInputValue(`confirmacao`);
                if (confirmacao.toLowerCase() !== `sim`) {
                    await interaction.update({ content: `${Emojis.get(`negative`)} Processo cancelado.`, components: [], flags: 64 });
                    setTimeout(() => {
                        BackupFunction(client, interaction);
                    }, 1000);
                    return;
                }
                await interaction.update({ content: `${Emojis.get(`loading`)} Aguarde...`, components: [], flags: 64 });
                let selecionado = `${interaction.customId.split(`_`)[1]}_${interaction.customId.split(`_`)[2]}`
                let backup = BackupStorage.get(selecionado)[0]
                if (!backup) {
                    await interaction.editReply({ content: `${Emojis.get(`negative`)} Backup/Template não encontrado.`, flags: 64 });
                    setTimeout(() => {
                        BackupFunction(client, interaction);
                    }, 1000);
                    return;
                }

                interaction.editReply({ content: `${Emojis.get(`loading`)} Verificando permissões...`, flags: 64 });

                try {
                    await client.guilds.fetch(interaction.guild.id).then(async (guild) => {
                        const botMember = await guild.members.fetch(client.user.id);
                        let perm = botMember.permissions.has(`ADMINISTRATOR`);
                        if (!perm) {
                            await interaction.editReply({ content: `${Emojis.get(`negative`)} Faltam permissões.`, flags: 64 });
                            setTimeout(() => {
                                BackupFunction(client, interaction);
                            }, 1000);
                            return;
                        }

                        let highestRole = guild.roles.highest;
                        let highestRoleInCache = botMember.roles.cache.sort((a, b) => b.position - a.position).first();

                        if (highestRole.position < highestRoleInCache.position) {
                            await interaction.editReply({ content: `${Emojis.get(`negative`)} Faltam permissões, adicione-me o maior cargo.`, flags: 64 });
                            setTimeout(() => {
                                BackupFunction(client, interaction);
                            }, 1000);
                            return;
                        }
                    });
                } catch (error) {
                    console.log(error)
                    interaction.editReply({ content: `${Emojis.get(`negative`)} Houve um erro ao processar permissões, processo de restauração cancelado.`, flags: 64 });
                    setTimeout(() => {
                        BackupFunction(client, interaction);
                    }, 1000);
                    return
                }

                interaction.editReply({ content: `${Emojis.get(`loading`)} Restaurando... Atualizações serão enviadas no seu privado.`, flags: 64 });
                await RestaurandoServidor(client, interaction, selecionado);
            }
        }
    }
}

async function RestaurandoServidor(client, interaction, selecionado) {
    try {
        await interaction.user.send({ content: `${Emojis.get(`loading`)} Restaurando servidor...` }).then(async (msg) => {
            await configuracao.set(`RestaurandoBackup`, {
                status: `Iniciando`,
                mensagem: msg.id,
                canal: msg.channel.id,
            })
        })
    } catch (error) {
        interaction.editReply({ content: `${Emojis.get(`negative`)} Não foi possível enviar mensagem privada, entretanto o processo de restauração continuará.`, flags: 64 });
    }

    let guild = await client.guilds.fetch(interaction.guild.id).catch(() => { });
    if (!guild) {
        interaction.editReply({ content: `${Emojis.get(`negative`)} Não foi possível encontrar o servidor, processo de restauração`, flags: 64 });
        setTimeout(() => {
            BackupFunction(client, interaction);
        }, 1000);
        return;
    }

    let DM_message

    try {
        let DM = await client.channels.fetch(configuracao.get(`RestaurandoBackup.canal`)).catch(() => { });
        DM_message = await DM.messages.fetch(configuracao.get(`RestaurandoBackup.mensagem`)).catch(() => { });
    } catch (error) {
        DM_message = false
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`loading`)} Deletando canais...` })
    }

    let canaisdeletar = guild.channels.cache

    for (const [key, value] of canaisdeletar) {
        await value.delete().catch((error) => { console.log(error) });
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} Canais Deletados.\n${Emojis.get(`loading`)} Deletando cargos...` })
    }

    let roles = guild.roles.cache.filter(r => r.id !== guild.id);

    for (const [key, value] of roles) {
        await value.delete().catch(() => { });
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} Cargos Deletados.\n${Emojis.get(`checker`)} Cargos Deletado.\n${Emojis.get(`loading`)} Deletando emojis...` })
    }

    let emojisdeletar = guild.emojis.cache.filter(e => e.id !== guild.id);

    for (const [key, value] of emojisdeletar) {
        await value.delete().catch(() => { });
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} Cargos Deletados.\n${Emojis.get(`checker`)} Cargos Deletado.\n${Emojis.get(`checker`)} Emojis Deletados.\n${Emojis.get(`loading`)} Deletando stickers...` })
    }

    let stickersdeletar = guild.stickers.cache.filter(s => s.id !== guild.id);

    for (const [key, value] of stickersdeletar) {
        await value.delete().catch(() => { });
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} Cargos Deletados.\n${Emojis.get(`checker`)} Cargos Deletado.\n${Emojis.get(`checker`)} Emojis Deletados.\n${Emojis.get(`checker`)} Stickers Deletados.\n${Emojis.get(`loading`)} Restaurando cargos...` })
    }

    let rolescriados = []
    let cargos = BackupStorage.get(selecionado)[0].roles;

    await Promise.all(cargos.map(async (element) => {
        try {
            let cargo = await guild.roles.create({
                name: element.name,
                color: element.color,
                hoist: element.hoist,
                permissions: element.permissions,
                mentionable: element.mentionable,
            })
            if (cargo) {
                rolescriados.push(cargo.id);
            }
        } catch (error) {
            console.log(`Erro ao criar cargo: ${element.name} - ${error.message}`)
        }
    }))


    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} \`${rolescriados.length}\` Cargos Criados.\n${Emojis.get(`loading`)} Criando Categorias...` })
    }

    let categoriascriadas = []
    let categorias = BackupStorage.get(selecionado)[0].channels

    for (const key in categorias) {
        const element = categorias[key];
        if (element.type === 4) {
            try {
                let categoria = await guild.channels.create({
                    name: element.name,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: element.permissionOverwrites || [],
                });
                if (categoria) {
                    categoriascriadas.push(categoria.id);
                }
            } catch (error) {
                console.log(`Erro ao criar categoria: ${element.name} - ${error.message}`)
            }
        }
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} \`${rolescriados.length}\` Cargos Criados.\n${Emojis.get(`checker`)} \`${categoriascriadas.length}\` Categorias Criadas.\n${Emojis.get(`loading`)} Criando canais...` })
    }


    let canaiscriados = []
    let canais = BackupStorage.get(selecionado)[0].channels
    await Promise.all(canais.map(async (element) => {
        if (element.type != 4) {
            try {
                let canal = await guild.channels.create({
                    name: element.name,
                    type: element.type,
                    parent: guild.channels.cache.find(categoria => categoria.name === element.categoria)?.id || null,
                    permissionOverwrites: element.permissionOverwrites || [],
                })
                if (canal) {
                    let novoset = configuracao.get(`ConfigChannels`)
                    if (element.type === 0) {
                        for (let key in novoset) {
                            if (novoset[key] === element.id) {
                                novoset[key] = canal.id;
                            }
                        }
                        configuracao.set(`ConfigChannels`, novoset);
                    }


                    canaiscriados.push(canal.id);
                }
            } catch (error) {
                console.log(`Erro ao criar canal: ${element.name} - ${error.message}`)
            }
        }
    }))

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} \`${rolescriados.length}\` Cargos Criados.\n${Emojis.get(`checker`)} \`${categoriascriadas.length}\` Categorias Criadas.\n${Emojis.get(`checker`)} \`${canaiscriados.length}\` Canais Criados.\n${Emojis.get(`loading`)} Restaurando permissões...` })
    }

    let canaisrestaurados = []
    let cargosrestaurados = []

    for (const key in canais) {
        const element = canais[key];
        let canal = guild.channels.cache.get(canaiscriados.find(c => c.name === element.name)?.id);
        if (!canal) {
            continue;
        }
        let permissoes = element.permissionOverwrites;
        for (const key2 in permissoes) {
            const element2 = permissoes[key2];
            let cargo = guild.roles.cache.get(rolescriados.find(r => r.name === element2.id));
            if (!cargo) {
                continue;
            }
            await canal.permissionOverwrites.create(cargo, element2);
            cargosrestaurados.push(cargo.id);
        }
        canaisrestaurados.push(canal.id);
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} \`${rolescriados.length}\` Cargos Criados.\n${Emojis.get(`checker`)} \`${categoriascriadas.length}\` Categorias Criadas.\n${Emojis.get(`checker`)} \`${canaiscriados.length}\` Canais Criados.\n${Emojis.get(`checker`)} \`${canaisrestaurados.length}\` Canais Restaurados.\n${Emojis.get(`checker`)} \`${cargosrestaurados.length}\` Permissões Restauradas.\n${Emojis.get(`loading`)} Restaurando emojis...` })
    }

    let emojis = BackupStorage.get(selecionado)[0].emojis;
    let emojisrestaurados = []

    for (const key in emojis) {
        const element = emojis[key];
        let emoji = await guild.emojis.create(element.url, element.name).catch(() => { });
        if (emoji) {
            emojisrestaurados.push(emoji.id);
        }
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} \`${rolescriados.length}\` Cargos Criados.\n${Emojis.get(`checker`)} \`${categoriascriadas.length}\` Categorias Criadas.\n${Emojis.get(`checker`)} \`${canaiscriados.length}\` Canais Criados.\n${Emojis.get(`checker`)} \`${canaisrestaurados.length}\` Canais Restaurados.\n${Emojis.get(`checker`)} \`${cargosrestaurados.length}\` Permissões Restauradas.\n${Emojis.get(`checker`)} \`${emojisrestaurados.length}\` Emojis Restaurados.\n${Emojis.get(`loading`)} Restaurando stickers...` })
    }

    let stickers = BackupStorage.get(selecionado)[0].stickers;
    let stickersrestaurados = []

    for (const key in stickers) {
        const element = stickers[key];
        let sticker = await guild.stickers.create(element.url, element.name).catch(() => { });
        if (sticker) {
            stickersrestaurados.push(sticker.id);
        }
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} \`${rolescriados.length}\` Cargos Criados.\n${Emojis.get(`checker`)} \`${categoriascriadas.length}\` Categorias Criadas.\n${Emojis.get(`checker`)} \`${canaiscriados.length}\` Canais Criados.\n${Emojis.get(`checker`)} \`${canaisrestaurados.length}\` Canais Restaurados.\n${Emojis.get(`checker`)} \`${cargosrestaurados.length}\` Permissões Restauradas.\n${Emojis.get(`checker`)} \`${emojisrestaurados.length}\` Emojis Restaurados.\n${Emojis.get(`checker`)} \`${stickersrestaurados.length}\` Stickers Restaurados.\n${Emojis.get(`loading`)} Restaurando mensagens...` })
    }

    let msgs = BackupStorage.get(selecionado)[0].msgs;
    let msgsrestauradas = []
    let produto = await produtos.fetchAll();
    for (const key in msgs) {
        let info = msgs[key];
        let canal = await guild.channels.cache.find(x => x.name === info.channel);
        if (info.message.authorId !== client.user.id) {
            try {
                let user = await client.users.fetch(info.message.authorId);
                let webhook = await canal.createWebhook(user.username, { avatar: user.displayAvatarURL({ dynamic: true }) });
                axios.post(`https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`, {
                    content: info.message.content,
                    username: user.username,
                    avatar_url: user.displayAvatarURL({ dynamic: true }),
                    embeds: info.message.embeds,
                    components: info.message.components,
                    files: info.message.attachments
                })
                msgsrestauradas.push(info.id);
            } catch (error) {
            }
        } else {
            try {
                produto = produto.forEach(element => {
                    return element.data.mensagens.find(x => x.mesageid === info.message.id);
                });

                if (produto || canal.id === configuracao.get(`ConfigChannels.eventbuy`)) {
                    canal.send({
                        content: info.message.content,
                        embeds: info.message.embeds,
                        components: info.message.components,
                        files: info.message.attachments
                    })
                    msgsrestauradas.push(info.id);
                }
            } catch (error) {

            }
        }
    }

    if (DM_message) {
        await DM_message.edit({ content: `${Emojis.get(`checker`)} \`${rolescriados.length}\` Cargos Criados.\n${Emojis.get(`checker`)} \`${categoriascriadas.length}\` Categorias Criadas.\n${Emojis.get(`checker`)} \`${canaiscriados.length}\` Canais Criados.\n${Emojis.get(`checker`)} \`${canaisrestaurados.length}\` Canais Restaurados.\n${Emojis.get(`checker`)} \`${cargosrestaurados.length}\` Permissões Restauradas.\n${Emojis.get(`checker`)} \`${emojisrestaurados.length}\` Emojis Restaurados.\n${Emojis.get(`checker`)} \`${stickersrestaurados.length}\` Stickers Restaurados.\n${Emojis.get(`checker`)} \`${msgsrestauradas.length}\` Mensagens Restauradas.\n${Emojis.get(`loading`)} Restaurando configurações...` })
    }

    let config = BackupStorage.get(selecionado)[0].config;
    let configrestaurada = []

    for (const key in config) {
        const element = config[key];
        guild.edit({ [key]: element }).catch((error) => { console.log(error) });
    }


    if (DM_message) {
        await DM_message.edit({
            content: `${Emojis.get(`checker`)} \`${rolescriados.length}\` Cargos Criados.\n${Emojis.get(`checker`)} \`${categoriascriadas.length}\` Categorias Criadas.\n${Emojis.get(`checker`)} \`${canaiscriados.length}\` Canais Criados.\n${Emojis.get(`checker`)} \`${canaisrestaurados.length}\` Canais Restaurados.\n${Emojis.get(`checker`)} \`${cargosrestaurados.length}\` Permissões Restauradas.\n${Emojis.get(`checker`)} \`${emojisrestaurados.length}\` Emojis Restaurados.\n${Emojis.get(`checker`)} \`${stickersrestaurados.length}\` Stickers Restaurados.\n${Emojis.get(`checker`)} \`${configrestaurada.length}\` Configurações Restauradas.\n${Emojis.get(`checker`)} Restauração concluída.`
        }).then((msg) => {
            setTimeout(() => {
                msg.delete().catch(() => { });
            }, 10000);
        })
    }
}