const { RoleSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType } = require("discord.js");
const { configuracao } = require("../../database");
const { ConfigRoles, ConfigChannels } = require("../../Functions/ConfigRoles");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {
            if (interaction.customId == 'personalizarcanais') {
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'voltar77roles') {
                ConfigRoles(interaction, client)
            }
            if (interaction.customId == 'voltar77channels') {
                ConfigChannels(interaction, client)
            }

        }

        if (interaction.isStringSelectMenu() && interaction.customId === "selectCargoC") {

            const option = interaction.values[0];

            if (option == 'definircargoadm') {
                const select = new RoleSelectMenuBuilder()
                    .setCustomId('definircargoadm')
                    .setPlaceholder('Selecione um cargo para definir como Administrador')
                    .setMinValues(1)
                    .setMaxValues(1)
                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77roles")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }
            if (option == 'definircargosup') {
                const select = new RoleSelectMenuBuilder()
                    .setCustomId('definircargosup')
                    .setPlaceholder('Selecione um cargo para definir como Suporte')
                    .setMinValues(1)
                    .setMaxValues(1)
                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77roles")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }
            if (option == 'roleclienteease') {
                const select = new RoleSelectMenuBuilder()
                    .setCustomId('roleclienteease')
                    .setPlaceholder('Selecione um cargo para definir como Cliente')
                    .setMinValues(1)
                    .setMaxValues(1)
                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77roles")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }
            if (option == 'rolememberok') {
                const select = new RoleSelectMenuBuilder()
                    .setCustomId('rolememberok')
                    .setPlaceholder('Selecione um cargo para definir como Membro')
                    .setMinValues(1)
                    .setMaxValues(1)
                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77roles")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }

        }

        if (interaction.isStringSelectMenu() && interaction.customId === "selectChannelC") {
            const option = interaction.values[0];
            
            if (option == 'antiraidlogschannel') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('antiraidlogschannel')
                    .setPlaceholder('Selecione um canal de log Anti-Raid')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar77channels")
                        .setLabel('Voltar')
                        .setEmoji(`1178068047202893869`)
                        .setStyle(2)
                )

                interaction.update({ components: [row, dd] })
            }

            if (option == 'logpedidos') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('logpedidos')
                    .setPlaceholder('Selecione um canal para definir como log de pedidos')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }

            if (option == 'logentrada') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('logentrada')
                    .setPlaceholder('Selecione um canal para definir como log de entrada')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }




            if (option == 'eventbuy') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('eventbuy')
                    .setPlaceholder('Selecione um canal para definir como log de compras')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }
            if (option == 'boasvindascoole') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('boasvindascoole')
                    .setPlaceholder('Selecione um canal para definir como log de Boas Vindas')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }
            if (option == 'systemlogs') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('systemlogs')
                    .setPlaceholder('Selecione um canal para definir como log do sistema')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }

            if (option == 'logsaida') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('logsaida')
                    .setPlaceholder('Selecione um canal para definir como log de saídas')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }

            if (option == 'logmensagem') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('logmensagem')
                    .setPlaceholder('Selecione um canal para definir como log de mensagens')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }

            if (option == 'trafegocall') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('trafegocall')
                    .setPlaceholder('Selecione um canal para definir como log de tráfego de call')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }

            if (option == 'feedback') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('feedback')
                    .setPlaceholder('Selecione um canal para definir como log de feedback')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);



                interaction.update({ components: [row, row2] })
            }

            if (option == 'auditoria') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('auditoria')
                    .setPlaceholder('Selecione um canal para definir como auditoria')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);

                interaction.update({ components: [row, row2] })
            }

            if (option == 'logsban') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('logsban')
                    .setPlaceholder('Selecione um canal para definir como logs de ban')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);

                interaction.update({ components: [row, row2] })
            }

            if (option == 'logscomandos') {
                const select = new ChannelSelectMenuBuilder()
                    .setCustomId('logscomandos')
                    .setPlaceholder('Selecione um canal para definir como logs de comandos')
                    .setMinValues(1)
                    .addChannelTypes(ChannelType.GuildText)
                    .setMaxValues(1)

                const row = new ActionRowBuilder()
                    .addComponents(select);

                const dd = new ButtonBuilder()
                    .setCustomId("voltar77channels")
                    .setLabel('Voltar')
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)

                const row2 = new ActionRowBuilder()
                    .addComponents(dd);

                interaction.update({ components: [row, row2] })
            }

        }

        if (interaction.isChannelSelectMenu()) {
            if (interaction.customId == 'antiraidlogschannel') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.antiraid`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'logpedidos') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.logpedidos`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'eventbuy') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.eventbuy`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'boasvindascoole') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.boasvindascoole`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'systemlogs') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.systemlogs`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'logentrada') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.entradas`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'logsaida') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.saídas`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'logmensagem') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.mensagens`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'trafegocall') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.tráfego`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'feedback') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.feedback`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'auditoria') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.auditoria`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'logsban') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.logsban`, channel)
                ConfigChannels(interaction, client)
            }
            if (interaction.customId == 'logscomandos') {
                const channel = interaction.values[0]
                configuracao.set(`ConfigChannels.logscomandos`, channel)
                ConfigChannels(interaction, client)
            }
        }

        if (interaction.isRoleSelectMenu()) {
            if (interaction.customId == 'definircargoadm') {
                const role = interaction.values[0]

                configuracao.set(`ConfigRoles.cargoadm`, role)
                ConfigRoles(interaction, client)
            }
            if (interaction.customId == 'definircargosup') {
                const role = interaction.values[0]
                configuracao.set(`ConfigRoles.cargosup`, role)
                ConfigRoles(interaction, client)
            }
            if (interaction.customId == 'roleclienteease') {
                const role = interaction.values[0]
                configuracao.set(`ConfigRoles.cargoCliente`, role)
                ConfigRoles(interaction, client)
            }
            if (interaction.customId == 'rolememberok') {
                const role = interaction.values[0]
                configuracao.set(`ConfigRoles.cargomembro`, role)
                ConfigRoles(interaction, client)
            }

        }


    }
}