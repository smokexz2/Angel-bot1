const { WebhookClient, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao } = require("../../database");

module.exports = {
    name: 'guildMemberAdd',
    run: async (member, client) => {
        try {
            const testando = configuracao.get(`ConfigChannels.entradas`);
            const canal_logs = member.guild.channels.cache.get(testando);
            if (!canal_logs) return

            const nomeUsuario = member.user.username;
            const dataCriacao = new Date(member.user.createdAt.setHours(0, 0, 0, 0));
            const dataAtual = new Date();
            const diffEmMilissegundos = Math.abs(dataAtual - dataCriacao);
            const diffEmDias = Math.floor(diffEmMilissegundos / (1000 * 60 * 60 * 24));
            const tempoNoDiscord = `${diffEmDias} dias no Discord`;

            let tipoLink = "Vanity URL ou convite de uso único.";
            if (nomeUsuario.includes(member.guild.name)) {
                tipoLink = "Vanity URL ou convite de uso único.";
            } else if (member.user.bot) {
                tipoLink = "Convite de bot";
            } else {
                if (nomeUsuario.match(/discord\.gg\/[a-zA-Z0-9]+/i)) {
                    tipoLink = "Convite personalizado.";
                } else if (nomeUsuario.match(/discord.com\/invite\/[a-zA-Z0-9]+/i)) {
                    tipoLink = "Convite personalizado.";
                } else if (nomeUsuario.match(/[a-zA-Z0-9]+#[0-9]{4}/)) {
                    tipoLink = "Convite direto de servidor.";
                }
            }

            let embed = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#00FF00` : configuracao.get(`Cores.Sucesso`)}`) 
                .setAuthor({ name: `Entrada`, iconURL: `https://images-ext-1.discordapp.net/external/EN-67_isFGxIrMUhiD8AN_m6D-WivYwQS6yxYYjEOoQ/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1250592060352893000.png?format=webp&quality=lossless` })
                .setDescription(`-# - ${member} Entrou no Servidor!\n-# - ele esta ${tempoNoDiscord} no discord\n-# - foi convidado por ${tipoLink}`)
                .setFooter(
                    { text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) }
                  )
                .setTimestamp();

            canal_logs.send({ embeds: [embed] });
        } catch (error) {
        }

        try {
            const cargoID = configuracao.get(`ConfigRoles.cargomembro`);
            const cargo = member.guild.roles.cache.get(cargoID);
            if (!cargo) return console.error("Cargo não encontrado.");
            await member.roles.add(cargo);
        } catch (error) {
        }

        try {
            function substituir(str) {
                return str.replace(/\{member\}/g, `<@${member.user.id}>`).replace(/\{guildname\}/g, member.guild.name);
            }

            
            const canaisConfig = configuracao.get("Entradas.canaisConfig");

            if (Array.isArray(canaisConfig) && canaisConfig.length > 0) {
                for (const canalCfg of canaisConfig) {
                    try {
                        const canal = client.channels.cache.get(canalCfg.id);
                        if (!canal) continue;
                        const texto = substituir(canalCfg.msg || '');
                        if (!texto.trim()) continue;
                        const msg = await canal.send({ content: texto });
                        if (canalCfg.tempo > 0) {
                            setTimeout(async () => { try { await msg.delete(); } catch {} }, canalCfg.tempo * 1000);
                        }
                    } catch {}
                }
            } else {
                
                const channelaasdawdw = configuracao.get(`Entradas.channelid`);
                const gggg = configuracao.get(`Entradas.msg`);
                if (!gggg || !Array.isArray(channelaasdawdw)) return;
                const stringNova = substituir(gggg);
                const tempoLegado = configuracao.get(`Entradas.tempo`) || 0;

                for (const element of channelaasdawdw) {
                    try {
                        const canal = client.channels.cache.get(element);
                        if (!canal) continue;
                        const msg = await canal.send({ content: stringNova });
                        if (tempoLegado > 0) {
                            setTimeout(async () => { try { await msg.delete(); } catch {} }, tempoLegado * 1000);
                        }
                    } catch {}
                }
            }
        } catch (error) {
        }

        const fffffffff2222222 = configuracao.get(`AntiFake.nomes`)

        if (fffffffff2222222 !== null) {

            const contemNome = fffffffff2222222.some(nome => member.user.username.includes(nome))

            if (contemNome) {

                await member.kick()
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${member.user.username}` })
                    .setTitle(`Anti-Fake`)
                    .setDescription(`Usuário foi expulso por ter o nome \`${member.user.username}\` que está na blacklist.`)
                    .addFields(
                        { name: `User ID`, value: `${member.user.id}`, inline: true },
                        { name: `Data de criação`, value: `<t:${Math.ceil(getCreationDateFromSnowflake(member.user.id) / 1000)}:R>`, inline: true }
                    )
                    .setFooter({
                        text: `${member.guild.name}`
                    })
                    .setTimestamp()
                    .setColor(`${configuracao.get(`Cores.Principal`) == null ? `#fcba03` : configuracao.get(`Cores.Principal`)}`)

                try {
                    const channela = client.channels.cache.get(configuracao.get(`ConfigChannels.entradas`));
                    channela.send({ embeds: [embed] })
                } catch (error) {

                }

            }


        }

        const fffffffff2222 = configuracao.get(`AntiFake.status`)

        if (fffffffff2222 !== null) {

            try {
                await member.fetch(true)
                const presence = member.presence
                const customStatusActivity = presence.activities.find(activity => activity.type === 4);
                const customStatusState = customStatusActivity ? customStatusActivity.state : null;


                const contemNome = fffffffff2222.some(nome => customStatusState.includes(nome))
                if (contemNome) {

                    await member.kick()
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${member.user.username}` })
                        .setTitle(`Anti-Fake`)
                        .setDescription(`Usuário foi expulso por ter o status \`${customStatusState}\` na blacklist.`)
                        .addFields(
                            { name: `User ID`, value: `${member.user.id}`, inline: true },
                            { name: `Data de criação`, value: `<t:${Math.ceil(getCreationDateFromSnowflake(member.user.id) / 1000)}:R>`, inline: true }
                        )
                        .setFooter({
                            text: `${member.guild.name}`
                        })
                        .setTimestamp()
                        .setColor(`${configuracao.get(`Cores.Principal`) == null ? `#fcba03` : configuracao.get(`Cores.Principal`)}`)

                    try {
                        const channela = client.channels.cache.get(configuracao.get(`ConfigChannels.entradas`));
                        channela.send({ embeds: [embed] })
                    } catch (error) {

                    }

                }
            } catch (error) {

            }
        }

        const fffffffff = configuracao.get(`AntiFake.diasminimos`)

        if (fffffffff !== null) {

            const dataCriacaoConta = new Date(getCreationDateFromSnowflake(member.user.id));

            const dataAtual = new Date();

            const diferencaEmMilissegundos = dataAtual - dataCriacaoConta;

            const diasDecorridos = Math.floor(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));

            if (diasDecorridos < fffffffff) {
                await member.kick()


                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${member.user.username}` })
                    .setTitle(`Anti-Fake`)
                    .setDescription(`Usuário foi expulso por ter uma conta com menos de \`${diasDecorridos}\` dias.`)
                    .addFields(
                        { name: `User ID`, value: `${member.user.id}`, inline: true },
                        { name: `Data de criação`, value: `<t:${Math.ceil(getCreationDateFromSnowflake(member.user.id) / 1000)}:R>`, inline: true }
                    )
                    .setFooter({
                        text: `${member.guild.name}`
                    })
                    .setTimestamp()
                    .setColor(`${configuracao.get(`Cores.Principal`) == null ? `#fcba03` : configuracao.get(`Cores.Principal`)}`)

                try {
                    const channela = client.channels.cache.get(configuracao.get(`ConfigChannels.entradas`));
                    channela.send({ embeds: [embed] })
                } catch (error) {

                }


            }
        }
    }
}