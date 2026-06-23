const { ActionRowBuilder, TextInputBuilder, TextInputStyle, InteractionType, ModalBuilder, EmbedBuilder, ButtonBuilder, Embed, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,ChannelType } = require("discord.js");
const { configuracao } = require("../../database");
const { Gerenciar } = require("../../Functions/Gerenciar");
const { FormasDePagamentos } = require("../../Functions/FormasDePagamentosConfig");
const { mpConfigs, BloquearBancos, BloquearConta } = require("../../Functions/mpConfigs");
const { efiConfigs, efiToggleSistema, efiModalCredenciais, efiHandleModalCredenciais } = require("../../Functions/efiConfigs");
const { misticConfigs } = require("../../Functions/misticpayconfig");
const axios = require('axios');
const mercadopago = require('mercadopago');
const { msgbemvindo } = require("../../Functions/MensagemBemVindo");
const { Emojis } = require("../../database");

const bankNames = {
'Nu Pagamentos S.A.': 'nu',
'Mercadopago.com Representações Ltda.': 'mp',
'Banco do Brasil S.A.': 'bdb',
'Caixa Econômica Federal': 'caixa',
'Banco Itaú Unibanco S.A.': 'itau',
'Banco Bradesco S.A.': 'bradesco',
'Banco Inter S.A.': 'inter',
'Neon Pagamentos S.A.': 'neon',
'Original S.A.': 'original',
'Next': 'next',
'Agibank': 'agibank',
'Santander (Brasil) S.A.': 'santander',
'C6 Bank S.A.': 'c6',
'Banrisul': 'banrisul',
'PagSeguro Internet S.A.': 'pagseguro',
'Picpay Serviços S.A.': 'picpay',
'Modalmais': 'modalmais'
};

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

              if (interaction.isButton()) {

            if (interaction.customId === 'editarmensagemboasvindas') {

                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju111idsjjsdua')
                    .setTitle(`Editar Boas Vindas`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`Mensagem`)
                    .setPlaceholder(`Insira aqui sua mensagem, use {member} para mencionar o membro e {guildname} para o servidor.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(1000)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`TEMPO PARA APAGAR A MENSAGEM`)
                    .setPlaceholder(`Insira aqui a quantidade em segundos.`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setMaxLength(6)


                const newnameboteN3 = new TextInputBuilder()
                    .setCustomId('qualcanal')
                    .setLabel(`QUAL CANAL VAI SER ENVIADO?`)
                    .setPlaceholder(`Insira aqui o ID do canal que vai enviar. (ID, ID, ID)`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN3);


                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5);
                await interaction.showModal(modalaAA);

            }
         }
      
 if (interaction.type == InteractionType.ModalSubmit) {
    if (interaction.customId === 'sdaju111idsjjsdua') {
        const title = interaction.fields.getTextInputValue('tokenMP');
        let title2 = interaction.fields.getTextInputValue('tokenMP2');
        const title3 = interaction.fields.getTextInputValue('qualcanal');

        
        if (!title || title.trim() === '') {
            return interaction.reply({
                content: `${Emojis.get(`negative`)} | O campo de mensagem não pode estar vazio!`,
                flags: 64
            });
        }

        if (!title3 || title3.trim() === '') {
            return interaction.reply({
                content: `${Emojis.get(`negative`)} | O campo de canais não pode estar vazio!`,
                flags: 64
            });
        }

        let arrayDeBancos = [];

        const stringSemEspacos = title3.replace(/\s/g, '');
        const ids = stringSemEspacos.split(`,`);
        const canaisInvalidos = [];

        for (const id of ids) {
            try {
                const canal = await interaction.guild.channels.fetch(id);
                if (!canal || canal.type !== ChannelType.GuildText) {
                    canaisInvalidos.push(id);
                } else {
                    arrayDeBancos.push(id);
                }
            } catch (err) {
                canaisInvalidos.push(id);
            }
        }

        if (canaisInvalidos.length > 0) {
            return interaction.reply({
                content: `${Emojis.get(`negative`)} | Os seguintes IDs de canais são inválidos ou não são canais de texto:\n\`${canaisInvalidos.join(`, `)}\``,
                flags: 64
            });
        }

        if (title2 !== '') {
            if (isNaN(title2)) {
                return interaction.reply({
                    content: `${Emojis.get(`negative`)} | Você colocou um tempo incorreto para a mensagem ser apagada!`,
                    flags: 64
                  });
              }
          } else {
              title2 = 0;
          }

          configuracao.set('Entradas', {
              msg: title,
              tempo: Number(title2),
              channelid: arrayDeBancos.map(id => String(id))
            });

            

               return interaction.reply({
               content: `${Emojis.get(`checker`)} | As informações foram atualizadas com sucesso!`,
               flags: 64
            });
      
        
            await msgbemvindo(interaction, client);
          }
       }

        if (interaction.type == InteractionType.ModalSubmit) {
            if (interaction.customId === `bloquearConta`) {
                const idconta = interaction.fields.getTextInputValue('idconta');
                const motivo = interaction.fields.getTextInputValue('motivo') || 'Sem motivo';
                const contasBloqueadas = await configuracao.get(`pagamentos.ContasBloqueadas`) || [];

                if (isNaN(idconta)) {
                    await BloquearConta(client, interaction);
                    await interaction.followUp({ content: `${Emojis.get(`negative`)} O ID da conta deve ser um número!`, flags: 64 });
                    return
                }

                if (contasBloqueadas.some(conta => conta.startsWith(`${idconta}`))) {
                    await BloquearConta(client, interaction);
                    await interaction.followUp({ content: `${Emojis.get(`negative`)} Esta conta já está bloqueada!`, flags: 64 });
                    return;
                }

                contasBloqueadas.push(`${idconta}:${motivo}`);
                configuracao.set(`pagamentos.ContasBloqueadas`, contasBloqueadas);
                await BloquearConta(client, interaction);
                await interaction.followUp({ content: `${Emojis.get(`checker`)} Conta bloqueada com sucesso!`, flags: 64 });
            } 
            if (interaction.customId === `desbloquearConta`) {
                const idconta = interaction.fields.getTextInputValue('idconta');
                const contasBloqueadas = await configuracao.get(`pagamentos.ContasBloqueadas`) || [];

                if (isNaN(idconta)) {
                    await BloquearConta(client, interaction);
                    await interaction.followUp({ content: `${Emojis.get(`negative`)} O ID da conta deve ser um número!`, flags: 64 });
                    return
                }

                if (!contasBloqueadas.some(conta => conta.startsWith(`${idconta}`))) {
                    await BloquearConta(client, interaction);
                    await interaction.followUp({ content: `${Emojis.get(`negative`)} Esta conta não está bloqueada!`, flags: 64 });
                    return;
                }

                const contas = contasBloqueadas.filter(conta => conta.split(':')[0] !== idconta);
                configuracao.set(`pagamentos.ContasBloqueadas`, contas);
                await BloquearConta(client, interaction);
                await interaction.followUp({ content: `${Emojis.get(`checker`)} Conta desbloqueada com sucesso!`, flags: 64 });
            }
        }
        if (interaction.isStringSelectMenu()) {
            
            if (interaction.customId == 'formas_pagamento_menu') {
                const selectedValue = interaction.values[0];
                
                if (selectedValue === 'configurarmercadopago') {
                    mpConfigs(interaction);
                }
                if (selectedValue === 'config_pagamentos_efibank') {
                    efiConfigs(interaction);
                }
                if (selectedValue === 'config_pagamentos_inter') {
                    const { imapConfigs } = require("../../Functions/configinter");
                    imapConfigs(interaction);
                }
                if (selectedValue === 'ConfigurarPagamentoManual') {
                    const { semiConfigs } = require("../../Functions/semiConfigs");
                    semiConfigs(interaction, client);
                }
                if (selectedValue === 'configurarmistic') {
                    misticConfigs(interaction, client);
                }
            }
            
            if (interaction.customId == `bloquearcontaselect`) {
                let option = interaction.values[0];
                if (option === `bloquearConta`) {
                    const modal = new ModalBuilder()
                        .setCustomId('bloquearConta')
                        .setTitle(`Bloquear Conta`);

                    const idconta = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('idconta')
                            .setLabel(`Numero da Conta Bancária`)
                            .setPlaceholder(`Insira o número da conta bancária aqui..`)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )

                    const motivo = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('motivo')
                            .setLabel(`Motivo do bloqueio (opcional)`)
                            .setPlaceholder(`Insira o motivo do bloqueio aqui..`)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                    )

                    modal.addComponents(idconta, motivo);
                    await interaction.showModal(modal);
                } else if (option === `desbloquearConta`) {
                    const modal = new ModalBuilder()
                        .setCustomId('desbloquearConta')
                        .setTitle(`Desbloquear Conta`);

                    const idconta = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('idconta')
                            .setLabel(`Numero da Conta Bancária`)
                            .setPlaceholder(`Insira o número da conta bancária aqui..`)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )

                    modal.addComponents(idconta);
                    await interaction.showModal(modal);
                } else if (option === `verContas`) {
                    const contasBloqueadas = await configuracao.get(`pagamentos.ContasBloqueadas`) || [];
                    if (contasBloqueadas.length === 0) {
                        interaction.reply({ content: `${Emojis.get(`_multi_silueta_emoji`)} Nenhuma conta bloqueada!`, flags: 64 });
                        return;
                    }
                    let contas = '';

                    for (const conta of contasBloqueadas) {
                        contas += `\`Conta: ${conta.split(`:`)[0]} | Motivo: ${conta.split(`:`)[1]}\`\n`;
                    }
                    
                    interaction.reply({ content: `${Emojis.get(`_multi_silueta_emoji`)} Contas bloqueadas:\n${contas}`, flags: 64 });
                }
            }
            if (interaction.customId == `desbloquearbancosselect`) {
                let bancos = interaction.values;
                let bancosBloqueados = await configuracao.get(`pagamentos.BancosBloqueados`);
                bancos = bancosBloqueados.filter(banco => bancos.includes(banco));
                bancosBloqueados = bancosBloqueados.filter(banco => !bancos.includes(banco));
                configuracao.set(`pagamentos.BancosBloqueados`, bancosBloqueados);
                await mpConfigs(interaction);
                interaction.followUp({ content: `${Emojis.get(`checker`)} Banco(s) desbloqueado(s) com sucesso!`, flags: 64 });
            }
            if (interaction.customId == `bloquearbancosselect`) {
                let bancos = interaction.values;
                let bancosBloqueados = await configuracao.get(`pagamentos.BancosBloqueados`);
                bancos = bancos.filter(banco => !bancosBloqueados.includes(banco));
                bancosBloqueados = bancosBloqueados.concat(bancos);
                configuracao.set(`pagamentos.BancosBloqueados`, bancosBloqueados);
                await mpConfigs(interaction);
                interaction.followUp({ content: `${Emojis.get(`checker`)} Banco(s) bloqueado(s) com sucesso!`, flags: 64 });
            }
            if (interaction.customId == `configurarmpselect`) {
                let option = interaction.values[0];
                if (option == 'alterarAccessToken') {
                    const modal = new ModalBuilder()
                        .setCustomId('tokenMP')
                        .setTitle(`Configurar Mercado Pago`);

                    const token = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('tokenMP')
                            .setLabel(`Chave SKD da API (Mercado Pago)`)
                            .setPlaceholder(`APP_USR-000000000000000-XX...`)
                            .setValue(configuracao.get(`pagamentos.MpAPI`) ? `${configuracao.get(`pagamentos.MpAPI`)}` : '')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )

                    modal.addComponents(token);
                    await interaction.showModal(modal);
                } else if (option == `bloquearBanco`) {
                    BloquearBancos(client, interaction)
                } else if (option == `bloquearUsuario`) {
                    BloquearConta(client, interaction)
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'desbloqueartodos') {
                configuracao.set(`pagamentos.BancosBloqueados`, []);
                await mpConfigs(interaction);
                interaction.followUp({ content: `${Emojis.get(`checker`)} Todos os bancos desbloqueados com sucesso!`, flags: 64 });
            }
            if (interaction.customId === 'liberarbanco') {
                let bancosBloqueados = await configuracao.get(`pagamentos.BancosBloqueados`);
                let opcoes = []

                for (const banco of bancosBloqueados) {
                    opcoes.push({
                        label: bankNames[banco],
                        value: banco
                    });
                }

                const selectMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`desbloquearbancosselect`)
                        .setPlaceholder(`Desbloquear bancos`)
                        .setMaxValues(opcoes.length)
                        .addOptions(opcoes.map(({ label, value }) => {
                            return new StringSelectMenuOptionBuilder()
                                .setLabel(`${value}`)
                                .setValue(`${value}`)
                        })
                        )
                )

                const botao2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`desbloqueartodos`)
                        .setLabel(`Desbloquear todos`)
                        .setEmoji(Emojis.get(`_trash_emoji`) || '🗑️')
                        .setStyle(2)
                )

                const botaovoltar = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("configurarmercadopago")
                        .setLabel('Voltar')
                        .setEmoji(`1238413255886639104`)
                        .setStyle(2),
                )

                await interaction.update({ components: [selectMenu, botao2, botaovoltar] })
            }
            if (interaction.customId === 'editarmensagemboasvindas') {
                const modalaAA = new ModalBuilder()
                    .setCustomId('editarmensagemboasvindas')
                    .setTitle(`Editar Boas Vindas`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`Mensagem`)
                    .setPlaceholder(`Insira aqui sua mensagem, use {member} para mencionar o membro e {guildname} para o servidor.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(configuracao.get('Entradas.msg'))
                    .setRequired(true)
                    .setMaxLength(1000)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`TEMPO PARA APAGAR A MENSAGEM`)
                    .setPlaceholder(`Insira aqui a quantidade em segundos.`)
                    .setValue(configuracao.get('Entradas.tempo'))
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(6)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);


                modalaAA.addComponents(firstActionRow3, firstActionRow4);
                await interaction.showModal(modalaAA);

            }



            if (interaction.customId == '+18porra') {

                const modalaAA = new ModalBuilder()
                    .setCustomId('tokenMP')
                    .setTitle(`Alterar Token`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel("TOKEN: APP_USR-000000000000000-XX...")
                    .setPlaceholder("APP_USR-000000000000000-XX...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(256)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                modalaAA.addComponents(firstActionRow3);
                await interaction.showModal(modalaAA);

            }

            if (interaction.customId == '-18porra') {


                const fernandinhaa = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setURL(`https://Kingappsauth.camposcloud.app/auth2/${interaction.guild.id}/VendasPrivadaV2`)
                            .setStyle(5)
                            .setLabel('Autorizar Mercado Pago'),
                        new ButtonBuilder()
                            .setCustomId('configurarmercadopago')
                            .setStyle(1)
                            .setEmoji(`1238413255886639104`)

                    )

                const forFormat = Date.now() + 10 * 60 * 1000

                const timestamp = Math.floor(forFormat / 1000)

                interaction.update({ embeds: [], content: `Autorizar seu **Mercado Pago** á **King Applications**\n\n**Status:** Aguardando você autorizar.\nEssa mensagem vai expirar em <t:${timestamp}:R>\n (Para autorizar, clique no botão abaixo, selecione 'Brasil' e clique em Continuar/Confirmar/Autorizar)`, components: [fernandinhaa] }).then(async msgg => {

                    const response2 = await axios.get(`https://stormappsauth.camposcloud.app/token2/${interaction.guild.id}/VendasPrivadaV2`);
                    const geral = response2.data;

                    var existia = null

                    if (geral.message !== 'Usuario nao encontado!') {
                        existia = geral.access_token
                    } else {
                        existia = 'Não definido'
                    }

                    var status = false;
                    var intervalId = null;
                    var tempoLimite = 5 * 60 * 1000;


                    if (status === false) {
                        intervalId = setInterval(async () => {
                            const response = await axios.get(`https://Kingappsauth.camposcloud.app/token2/${interaction.guild.id}/VendasPrivadaV2`);
                            const geral = response.data;

                            if (geral.message == 'Usuario nao encontado!') {
                                status = false;
                            } else {
                                if (existia === 'Não definido' || existia !== geral.access_token) {
                                    status = true;
                                    clearInterval(intervalId);
                                    configuracao.set(`pagamentos.MpAPI`, geral.access_token)

                                    const fernandinhaa = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('configurarmercadopago')
                                                .setStyle(1)
                                                .setEmoji('1238413255886639104')

                                        )

                                    interaction.editReply({
                                        content: `**Status:** ${Emojis.get(`checker`)} Autorização bem sucedida!.`,
                                        components: [fernandinhaa]
                                    })
                                }
                            }
                        }, 5000);
                        setTimeout(async () => {
                            clearInterval(intervalId);

                            const fernandinhaa = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('voltar1234sda')
                                        .setStyle(1)
                                        .setEmoji('1238413255886639104')

                                )

                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setDescription(`${Emojis.get(`negative`)} Você não se cadastrou durante 5 Minutos, cadastre-se novamente!`)
                                ],
                                components: [fernandinhaa]
                            })

                        }, tempoLimite);
                    }
                })
            }


            if (interaction.customId === 'voltaradawdwa') {
                Gerenciar(interaction, client)
            }
            if (interaction.customId === 'formasdepagamentos') {
                FormasDePagamentos(interaction)
            }
            if (interaction.customId === 'voltarformasdepagamentos') {
                FormasDePagamentos(interaction)
            }
            if (interaction.customId == 'configurarmercadopago') {
                mpConfigs(interaction);
            }
            
            
            if (interaction.customId === 'efi_alterar_credenciais') {
                await efiModalCredenciais(interaction);
            }
            if (interaction.customId === 'efi_toggle_sistema') {
                await efiToggleSistema(interaction);
            }
            
            if (interaction.customId == `exemplesbancks`) {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Exemplos Bancos`)
                            .setDescription(`Em cima fica o banco que será bloqueado e em baixo o que setar no **Bloquear Banco** para bloquear aquele banco, vale ressaltar que para setar vários bancos no bloquear banco, usa-se virgula a cada nome setado. Ex: \`inter, nu\``)
                            .setFields(
                                {
                                    name: `Nu Pagamentos S.A.`, value: `\`nu\``, inline: true
                                },
                                {
                                   name: `Picpay Serviços S.A.`, value: `\`picpay\``, inline: true
                                },
                                {
                                  name: `Modalmais`, value: `\`modalmais\``,inline: true
                                },
                                {
                                 name: `PagSeguro Internet S.A.`, value: `\`pagseguro\``, inline: true
                                },
                                {
                                 name: `Banrisul`, value: `\`banrisul\``, inline: true
                                },
                                {
                                 name: `C6 Bank S.A.`, value: `\`c6\``, inline: true
                                },
                                {
                                 name: `Santander (Brasil) S.A.`,value: `\`santander\``, inline: true
                                },
                                {
                                 name: `Agibank`, value: `\`agibank\``, inline: true
                                },
                                {
                                 name: `Next`, value: `\`next\``, inline: true
                                },
                                {
                                 name: `Original S.A.`,value: `\`original\``, inline: true
                                },
                                {
                                 name: `Neon Pagamentos S.A.`, value: `\`neon\``, inline: true
                                },
                                {
                                 name: `Banco Inter S.A.`, value: `\`inter\``, inline: true
                                },
                                {
                                 name: `Banco Bradesco S.A.`, value: `\`bradesco\``, inline: true
                                },
                                {
                                 name: `Banco Itaú Unibanco S.A.`, value: `\`itau\``, inline: true
                                },
                                {
                                 name: `Caixa Econômica Federal`, value: `\`caixa\``, inline: true
                                },
                                {
                                 name: `Banco do Brasil S.A`, value: `\`bdb\``, inline: true
                                },
                                {
                                 name: `Mercadopago.com Representações Ltda.`, value: `\`mp\``, inline: true
                                }
                              
                            )
                            .setColor(`${configuracao.get(`Cores.Principal`) == null ? `0cd4cc` : configuracao.get('Cores.Principal')}`)
                            .setFooter(
                                { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
                            )
                            .setTimestamp()
                    ], flags: 64
                })

            }

            if (interaction.customId == 'onOffMp') {

                if (configuracao.get(`pagamentos.MpOnOff`) == true) {
                    configuracao.set(`pagamentos.MpOnOff`, false)
                } else {
                    configuracao.set(`pagamentos.MpOnOff`, true)
                }

                mpConfigs(interaction)
            }
            if (interaction.customId == 'alterarSiteMp') {

                if (configuracao.get(`pagamentos.MpSite`) == true) {
                    configuracao.set(`pagamentos.MpSite`, false)
                } else {
                    configuracao.set(`pagamentos.MpSite`, true)
                }

                mpConfigs(interaction)
            }

            if (interaction.customId == 'bloquearbancos') {

                const validBanks = ['nu', 'mp', 'bdb', 'caixa', 'itau', 'bradeosco', 'inter', 'neon','original','next','agibank','santander','c6','banrisul','pagsegur','picpay','modalmais'];

                const blockedBanks = configuracao.get(`pagamentos.BancosBloqueados`);
                let bankList = '';
                blockedBanks.forEach((bank) => {
                    bankList += `${bank}, `;
                });
                bankList = bankList.trim().replace(/, $/, '');

                const modal = new ModalBuilder()
                    .setCustomId('gostmpbancos')
                    .setTitle(`Bloquear Bancos`);

                const bankInput = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel("BANCOS BLOQUEADOS")
                    .setPlaceholder(`Insira os bancos que deseja recusar separado por vírgula, ex: inter, nu`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(bankList)
                    .setRequired(false);

                const actionRow = new ActionRowBuilder().addComponents(bankInput);
                modal.addComponents(actionRow);
                await interaction.showModal(modal);
            }
        }
        if (interaction.type == InteractionType.ModalSubmit) {

            
            if (interaction.customId === 'efi_modal_credenciais') {
                await efiHandleModalCredenciais(interaction);
                return;
            }

            if (interaction.customId === 'sdaju111idsjjsdua') {
                const title = interaction.fields.getTextInputValue('tokenMP');
                let title2 = interaction.fields.getTextInputValue('tokenMP2');

                if (title2 !== '') {
                    if (isNaN(title2) == true) return interaction.reply({ content: `${Emojis.get(`negative`)} Você colocou um tempo incorreto para a mensagem ser apagada!`, flags: 64 })
                } else {
                    title2 = 0
                }


                configuracao.set('Entradas', {
                    msg: title,
                    tempo: Number(title2)
                })

                await msgbemvindo(interaction, client)
            }


            if (interaction.customId === 'gostmpbancos') {

                const validBanks = ['nu', 'mp', 'bdb', 'caixa', 'itau', 'bradesco', 'inter', 'neon','original','next','agibank','santander','c6','banrisul','pagseguro','picpay','modalmais'];

                const inputBanks = interaction.fields.getTextInputValue('tokenMP2');
                if (inputBanks !== '') {
                    const inputBanksArray = inputBanks.replace(/\s/g, '').split(`,`);
                    const invalidBanks = inputBanksArray.filter((bank) => !validBanks.includes(bank));
                    if (invalidBanks.length > 0) {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`Ops... parece que o banco que você setou é inválido, olhe exemplos de banco clicando no botão **Exemplos Bancos** abaixo.`)
                                    .setColor(`${configuracao.get(`Cores.Principal`) == null ? `0cd4cc` : configuracao.get('Cores.Principal')}`)
                            ], components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("exemplesbancks")
                                            .setLabel('Exemplos Bancos')
                                            .setEmoji(`1238417688129310782`)
                                            .setStyle(2)
                                            .setDisabled(false)
                                    )], flags: 64
                        });
                    } else {
                        configuracao.set(`pagamentos.BancosBloqueados`, inputBanksArray);
                        mpConfigs(interaction);
                    }
                } else {
                    configuracao.set(`pagamentos.BancosBloqueados`, []);
                    mpConfigs(interaction);
                }
            }



            if (interaction.customId === 'tokenMP') {
                const token = interaction.fields.getTextInputValue('tokenMP');
                let response = await fetch('https://api.mercadopago.com/v1/customers/search?email=jhon@doe.com', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                response = await response.json()

                if (response?.code == 'unauthorized') {
                    await mpConfigs(interaction)
                    interaction.followUp({ content: `${Emojis.get(`negative`)} Token MP inválido!`, flags: 64 })
                    return
                }

                configuracao.set(`pagamentos.MpAPI`, token);
                await mpConfigs(interaction)
                interaction.followUp({ content: `${Emojis.get(`checker`)} Token MP alterado com sucesso!`, flags: 64 })
            }
        }
    }
}