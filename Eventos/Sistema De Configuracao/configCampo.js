
const Discord = require("discord.js")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { produtos, configuracao } = require("../../database");
const { QuickDB } = require("../../database/jsondb");
const { GerenciarCampos, GerenciarCampos2 } = require("../../Functions/GerenciarCampos");
const { MessageStock } = require("../../Functions/ConfigEstoque.js");
const { UpdateMessageProduto } = require("../../Functions/SenderMessagesOrUpdates");
const { Gerenciar2 } = require("../../Functions/Painel.js");
const { notificarStockAdicionado } = require("../../Functions/StockAutoNotify");
const db = new QuickDB();
const emojis = require("../../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.type == Discord.InteractionType.ModalSubmit) {
            if (interaction.customId === 'sdaju11111idsjjs123dua123') {
                let a1 = interaction.fields.getTextInputValue('tokenMP');
                let a2 = interaction.fields.getTextInputValue('tokenMP2');
                let a3 = interaction.fields.getTextInputValue('tokenMP3');
                let a4 = interaction.fields.getTextInputValue('tokenMP5');
                let a5 = interaction.fields.getTextInputValue('tokenMP6');
                const regexPadrao = /^#[0-9a-fA-F]{6}$/;

                if (a1 !== ``) {
                    if (regexPadrao.test(a1)) {
                        configuracao.set(`Cores.Principal`, a1)
                    } else {
                        return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cor \`${a1}\` inválida (Principal).` })
                    }
                }
                if (a2 !== ``) {
                    if (regexPadrao.test(a2)) {
                        configuracao.set(`Cores.Processamento`, a2)
                    } else {
                        return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cor \`${a2}\` inválida (Processamento).` })
                    }
                }
                if (a3 !== ``) {
                    if (regexPadrao.test(a3)) {
                        configuracao.set(`Cores.Sucesso`, a3)
                    } else {
                        return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cor \`${a3}\` inválida (Sucesso).` })
                    }
                }
                if (a4 !== ``) {
                    if (regexPadrao.test(a4)) {
                        configuracao.set(`Cores.Erro`, a4)
                    } else {
                        return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cor \`${a4}\` inválida (Falha).` })
                    }
                }
                if (a5 !== ``) {
                    if (regexPadrao.test(a5)) {
                        configuracao.set(`Cores.Finalizado`, a5)
                    } else {
                        return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cor \`${a5}\` inválida (Finalizado).` })
                    }
                }

                interaction.reply({ content: `${Emojis.get(`checker`)} | Cores atualizadas com sucesso!`, flags: 64 })


            }


            if (interaction.customId === 'sdaju11111231idsjjs123dua123') {
                await interaction.deferUpdate();
                
                let a1 = interaction.fields.getTextInputValue('tokenMP');
                let a2 = interaction.fields.getTextInputValue('tokenMP2');
                let a3 = interaction.fields.getTextInputValue('tokenMP3');
                let a4 = interaction.fields.getTextInputValue('tokenMP5');

                if (a1 !== ``) {
                    try {
                        await client.user.setUsername(a1)
                    } catch (error) {
                        return interaction.followUp({ flags: 64, content: `${Emojis.get(`negative`)} Nome inserido \`${a1}\` inválido ou então você alterou mais de 3 vezes o nome em 1 hora!` })
                    }
                }
                if (a2 !== ``) {
                    try {
                        await client.user.setAvatar(a2)
                    } catch (error) {
                        return interaction.followUp({ flags: 64, content: `${Emojis.get(`negative`)} Avatar inserido \`${a2}\` inválido.` })
                    }
                }

                if (a3 !== '') {
                    configuracao.set(`Status1`, a3)
                }
                if (a4 !== ``) {
                    configuracao.set(`Status2`, a4)
                }

                await interaction.followUp({ content: `${Emojis.get(`checker`)} | Configurações atualizadas com sucesso!`, flags: 64 })

            }


            if (interaction.customId === 'dassdadassddsdasddassddasd') {
                let ADD = interaction.fields.getTextInputValue('tokenMP');
                let REM = interaction.fields.getTextInputValue('tokenMP2');


                const ggg = await db.get(interaction.message.id)

                const hhhh = produtos.get(`${ggg.name}.Campos`)
                const gggaaa = hhhh.find(campo => campo.Nome === ggg.camposelect)

                if (ADD !== ``) {
                    const ddd = await interaction.guild.roles.fetch(ADD)
                    if (ddd == null) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cargo inserido \`${ADD}\` inválido.` })
                    gggaaa.roleadd = ddd.id
                } else {
                    delete gggaaa.roleadd
                }

                if (REM !== ``) {
                    const ddd = await interaction.guild.roles.fetch(REM)
                    if (ddd == null) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cargo inserido \`${REM}\` inválido.` })
                    gggaaa.rolerem = ddd.id
                } else {
                    delete gggaaa.rolerem
                }
                await produtos.set(`${ggg.name}.Campos`, hhhh)

                await GerenciarCampos2(interaction, ggg.camposelect)

                interaction.followUp({ content: `${Emojis.get(`checker`)} | Alterações realizadas com sucesso!`, flags: 64 })


            }

            
            if (interaction.customId === 'cargosremaddmodal') {
                let ADD = interaction.fields.getTextInputValue('tokenMP');
                let REM = interaction.fields.getTextInputValue('tokenMP2');
                let TEMPO = interaction.fields.getTextInputValue('tokenMP3');

                const ggg = await db.get(interaction.message.id)

                const hhhh = produtos.get(`${ggg.name}.Campos`)
                const gggaaa = hhhh.find(campo => campo.Nome === ggg.camposelect)

                if (ADD !== ``) {
                    const ddd = await interaction.guild.roles.fetch(ADD)
                    if (ddd == null) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cargo inserido \`${ADD}\` inválido.` })
                    gggaaa.roleadd = ddd.id
                } else {
                    delete gggaaa.roleadd
                }

                if (REM !== ``) {
                    const ddd = await interaction.guild.roles.fetch(REM)
                    if (ddd == null) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cargo inserido \`${REM}\` inválido.` })
                    gggaaa.rolerem = ddd.id
                } else {
                    delete gggaaa.rolerem
                }

                if (TEMPO !== ``) {
                    gggaaa.temprole24 = TEMPO
                } else {
                    delete gggaaa.temprole24
                }

                await produtos.set(`${ggg.name}.Campos`, hhhh)

                await GerenciarCampos2(interaction, ggg.camposelect)

                interaction.followUp({ content: `${Emojis.get(`checker`)} | Cargos configurados com sucesso!`, flags: 64 })
            }








            if (interaction.customId === 'configcampoo') {

                const ggg = await db.get(interaction.message.id)
                let nomecampo = interaction.fields.getTextInputValue('tokenMP');
                let preco = interaction.fields.getTextInputValue('tokenMP2');
                let desc = interaction.fields.getTextInputValue('tokenMP3');
                let emoji = interaction.fields.getTextInputValue('tokenMP7');

                if (!emoji) {
                    emoji = `1449070464981930015`;
                }

                const hhhh = produtos.get(`${ggg.name}.Campos`)


                const campoParaAtualizar = hhhh.find(campo => campo.Nome === ggg.camposelect);

                preco = parseFloat(preco.replace(",", "."));
                if (isNaN(preco)) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Preço inserido \`${preco}\` inválido.` })

                if (ggg.camposelect !== nomecampo) {
                    const produtoExistente = produtos
                        .filter(produto => produto.data.Campos)
                        .some(produto => produto.data.Campos.some(campo => campo.Nome === nomecampo));

                    if (produtoExistente) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Nome do campo já existente.` })
                }


                campoParaAtualizar.valor = preco;
                campoParaAtualizar.Nome = nomecampo;
                campoParaAtualizar.desc = desc;
                campoParaAtualizar.emoji = emoji;






                await produtos.set(`${ggg.name}.Campos`, hhhh)

                await GerenciarCampos2(interaction, nomecampo)
                
                interaction.followUp({ content: `${Emojis.get(`checker`)} | Informações do campo atualizadas com sucesso!`, flags: 64 })
            }



            if (interaction.customId == 'definircondicoes') {

                const ggg = await db.get(interaction.message.id)
                let idcargo = interaction.fields.getTextInputValue('tokenMP');
                let valorminimo = interaction.fields.getTextInputValue('tokenMP2');
                let valormaximo = interaction.fields.getTextInputValue('tokenMP3');

                const hhhh = produtos.get(`${ggg.name}.Campos`)
                const campoParaAtualizar = hhhh.find(campo => campo.Nome === ggg.camposelect);

                if (idcargo !== ``) {
                    const ddd = await interaction.guild.roles.fetch(idcargo)
                    if (ddd == null) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Cargo inserido \`${idcargo}\` inválido.` })
                }

                if (valorminimo !== ``) {
                    valorminimo = parseInt(valorminimo, 10);
                    if (!Number.isInteger(valorminimo)) {
                        return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Quantidade inserida \`${valorminimo}\` inválido. Insira apenas números inteiros.` });
                    }
                }

                if (valormaximo !== ``) {
                    valormaximo = parseInt(valormaximo, 10);
                    if (!Number.isInteger(valormaximo)) {
                        return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Quantidade inserida \`${valormaximo}\` inválido. Insira apenas números inteiros.` });
                    }
                }

                campoParaAtualizar.condicao = {
                    ...(idcargo !== '' ? { idcargo } : {}),
                    ...(valorminimo !== '' ? { valorminimo } : {}),
                    ...(valormaximo !== `` ? { valormaximo } : {}),
                };

                await produtos.set(`${ggg.name}.Campos`, hhhh)

                await GerenciarCampos2(interaction, ggg.camposelect)
                
                interaction.followUp({ content: `${Emojis.get(`checker`)} | Condições atualizadas com sucesso!`, flags: 64 })
            }

            if (interaction.customId == 'addestoquemodalaaa') {
                const ggg = await db.get(interaction.message.id)
                let idcargo = interaction.fields.getTextInputValue('tokenMP');



                const linhas = idcargo.split('\n');
                const tresPrimeirasLinhas = linhas.slice(0, 3); 



                const linhasNumeradas = tresPrimeirasLinhas.map((linha, index) => `${index + 1}・${linha}`);


                const row4 = new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId("simestoque")
                            .setLabel('Sim')
                            .setEmoji(`1178076954029731930`)
                            .setStyle(3),

                        new ButtonBuilder()
                            .setCustomId("definirlimitador")
                            .setLabel(`Definir delimitador`)
                            .setEmoji(`1178317298793205851`)
                            .setStyle(2)
                    )


                interaction.reply({
                    components: [row4],
                    content: `Total de \`${linhas.length}\` itens detectados, cada item será adicionado como um produto no estoque de \`${ggg.camposelect}\`, exemplo:\`\`\`${linhasNumeradas.join(`\n`)}\`\`\`\nEsse valor será entregue como **uma** unidade para o cliente.\n**Deseja adicionar o valor de \`${linhas.length}\` itens ao estoque de \`${ggg.camposelect}\`?**`,
                    flags: 64
                }).then(async msg222 => {
                    await db.set(`${interaction.user.id}.delimitadorStock`, { estoque: idcargo, delimitador: null, produto: ggg.name, campo: ggg.camposelect });
                });



                
                

            }






















            if (interaction.customId == 'definirlimitadororrr') {
                const ggg22 = await db.get(`${interaction.user.id}.delimitadorStock`)
                let delimitador = interaction.fields.getTextInputValue('tokenMP');



                var arraysSeparados2222 = ``
                var qtdlinhas = 0
                if (delimitador !== '') {

                    const linhasSeparadas = ggg22.estoque.split(delimitador);
                    const arraysSeparados = linhasSeparadas.map(item => item.trim()).filter(item => item !== '');


                    await db.set(`${interaction.user.id}.delimitadorStock.delimitador`, delimitador);


                    for (let i = arraysSeparados.length - 1; i >= Math.max(0, arraysSeparados.length - 4); i--) {
                        const campooo = arraysSeparados[i];
                        arraysSeparados2222 += `${campooo}\n`;
                    }

                    if (arraysSeparados.length > 4) {
                        arraysSeparados2222 += `E mais ${arraysSeparados.length - 4}...`;
                    }

                    qtdlinhas = arraysSeparados.length
                } else {
                    await db.set(`${interaction.user.id}.delimitadorStock`, { estoque: ggg22.estoque, delimitador: null, produto: ggg22.produto, campo: ggg22.campo });


                    const linhas = ggg22.estoque.split(`\n`);
                    const primeiraLinha = linhas[0];
                    qtdlinhas = linhas.length
                    arraysSeparados2222 = primeiraLinha
                }

                interaction.update({
                    content: `
                Seu delimitador agora é \`${delimitador == `` ? `Não Definido` : delimitador}\`, cade item será adicionado como um produto no estoque de \`${ggg22.campo}\`, exemplo:\n\`${arraysSeparados2222}\`
                
Esse valor será entregue como **uma** unidade para o cliente.
**Deseja adicionar o valor de \`${qtdlinhas}\`\ itens ao estoque de \`${ggg22.campo}\`?**
                                    `})

            }


            if (interaction.customId == 'sd1213aju11111idsjjsdua') {

                const ggg = await db.get(interaction.message.id)
                let qtd = interaction.fields.getTextInputValue('tokenMP');
                let produto = interaction.fields.getTextInputValue(`tokenMP2`);

                if (qtd > 100000) return interaction.reply({ content: `${Emojis.get(`negative`)} Não foi possível adicionar esse estoque.`, flags: 64 })

                if (isNaN(qtd)) return interaction.reply({ content: `${Emojis.get(`negative`)} Esse número não é válido \`${qtd}\`.`, flags: 64 })

                const arrayItens = [];
                if (produto == ``) {
                    for (let i = 0; i < qtd; i++) {
                        const linha = `Item fantasma ${i + 1}/${qtd}`;
                        arrayItens.push(linha);
                    }
                } else {
                    for (let i = 0; i < qtd; i++) {
                        const linha = `${produto} ${i + 1}/${qtd}`;
                        arrayItens.push(linha);
                    }
                }




                await interaction.reply({ content: `${Emojis.get(`loading`)} Aguarde...`, flags: 64 }).then(async tt => {

                    await tt.edit({ content: `${Emojis.get(`loading`)} Atualizando estoque...` }).then(async msg => {

                        const hhhh = produtos.get(`${ggg.name}.Campos`)
                        const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect)
                        gggaaa.estoque.push(...arrayItens);

                        await produtos.set(`${ggg.name}.Campos`, hhhh)
                        await produtos.set(`${ggg.name}.UltimaReposicao`, Date.now())

                    })

                    await tt.edit({ content: `${Emojis.get(`loading`)} Sincronizando mensagens...`, flags: 64 }).then(async msg => {
                        await UpdateMessageProduto(client, ggg.name)

                    })

                    await tt.edit({ content: `${Emojis.get(`checker`)} Total de \`${qtd}\` itens fantasma adicionado ao estoque.`, flags: 64 })

                    
                    try {
                        const hhhh2 = produtos.get(`${ggg.name}.Campos`);
                        const gggaaa2 = hhhh2.find(c => c.Nome === ggg.camposelect);
                        const stockTotal = gggaaa2 ? gggaaa2.estoque.length : parseInt(qtd);
                        const nomeProduto = produtos.get(`${ggg.name}.Nome`) || ggg.name;
                        const _mens = produtos.get(`${ggg.name}.mensagens`) || [];
                        notificarStockAdicionado(client, nomeProduto, ggg.camposelect, parseInt(qtd), stockTotal, _mens).catch(() => {});
                    } catch (e) {}
                })


            }


            if (interaction.customId == 'sdaju11124124111231idsjjs123dua123') {
                const ggg = await db.get(interaction.message.id);
                let qtd = interaction.fields.getTextInputValue('tokenMP');

                if (qtd !== `sim`) return interaction.reply({ content: `${Emojis.get(`negative`)} Confirmação não validada.`, flags: 64 });

                const hhhh = produtos.get(`${ggg.name}.Campos`);
                const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect);

                gggaaa.estoque = [];

                await produtos.set(`${ggg.name}.Campos`, hhhh);

                await GerenciarCampos2(interaction, ggg.camposelect);

                try {
                    await UpdateMessageProduto(client, ggg.name);
                    interaction.followUp({ content: `${Emojis.get(`checker`)} | Estoque limpo com sucesso!`, flags: 64 });
                } catch (error) {
                    console.error("Error:", error);
                }



            }

        }

        
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'campo_config_menu') {
                const selectedValue = interaction.values[0];
                const ggg = await db.get(interaction.message.id);
                
                if (selectedValue === 'editarcampooo') {
                    const hhhh = produtos.get(`${ggg.name}.Campos`);
                    const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect);

                    const modalaAA = new ModalBuilder()
                        .setCustomId('configcampoo')
                        .setTitle(`Editando o campo`);

                    const newnameboteN = new TextInputBuilder()
                        .setCustomId('tokenMP')
                        .setLabel(`NOME DO CAMPO`)
                        .setPlaceholder(`Insira o nome desejado`)
                        .setValue(`${gggaaa.Nome}`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const newnameboteN2 = new TextInputBuilder()
                        .setCustomId(`tokenMP2`)
                        .setLabel(`PREÇO DO CAMPO`)
                        .setPlaceholder(`Insira um preço desejado (BRL)`)
                        .setValue(`${Number(gggaaa.valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const newnameboteN24 = new TextInputBuilder()
                        .setCustomId('tokenMP7')
                        .setLabel(`Ponha um emoji`)
                        .setPlaceholder(`ponha um emoji (apenas o id)`)
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(20)
                        .setRequired(false);

                    const newnameboteN4 = new TextInputBuilder()
                        .setCustomId('tokenMP3')
                        .setLabel(`DESCRIÇÃO DO CAMPO (OPCIONAL)`)
                        .setPlaceholder(`Insira um descrição desejada`)
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(4000)
                        .setRequired(false);

                    if (gggaaa.desc && gggaaa.desc !== '') {
                        newnameboteN4.setValue(gggaaa.desc);
                    }

                    if (gggaaa.emoji) {
                        newnameboteN24.setValue(`${gggaaa.emoji}`);
                    }

                    const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                    const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                    const firstActionRow24 = new ActionRowBuilder().addComponents(newnameboteN24);
                    const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);

                    modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow24, firstActionRow5);
                    await interaction.showModal(modalaAA);
                }
                
                if (selectedValue === 'cargosremadd') {
                    const hhhh = produtos.get(`${ggg.name}.Campos`);
                    const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect);

                    const modalaAA = new ModalBuilder()
                        .setCustomId('cargosremaddmodal')
                        .setTitle(`Configurar cargos`);

                    const newnameboteN = new TextInputBuilder()
                        .setCustomId('tokenMP')
                        .setLabel(`CARGO PARA ADICIONAR (ID)`)
                        .setPlaceholder(`Insira o ID do cargo para adicionar após a compra`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const newnameboteN2 = new TextInputBuilder()
                        .setCustomId('tokenMP2')
                        .setLabel(`CARGO PARA REMOVER (ID)`)
                        .setPlaceholder(`Insira o ID do cargo para remover após a compra`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const newnameboteN3 = new TextInputBuilder()
                        .setCustomId('tokenMP3')
                        .setLabel(`TEMPO DO CARGO (OPCIONAL)`)
                        .setPlaceholder(`Ex: 24H, 7D, 30M (H=horas, D=dias, M=minutos)`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    if (gggaaa.roleadd) {
                        newnameboteN.setValue(`${gggaaa.roleadd}`);
                    }
                    if (gggaaa.rolerem) {
                        newnameboteN2.setValue(`${gggaaa.rolerem}`);
                    }
                    if (gggaaa.temprole24) {
                        newnameboteN3.setValue(`${gggaaa.temprole24}`);
                    }

                    const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                    const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                    const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN3);

                    modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5);
                    await interaction.showModal(modalaAA);
                }
                
                if (selectedValue === 'gwdawdwadawawderenciarcampossss') {
                    const hhhh = produtos.get(`${ggg.name}.Campos`);
                    const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect);

                    const modalaAA = new ModalBuilder()
                        .setCustomId('definircondicoes')
                        .setTitle(`Definir condições`);

                    const newnameboteN = new TextInputBuilder()
                        .setCustomId('tokenMP')
                        .setLabel(`ID DO CARGO`)
                        .setPlaceholder(`Insira algum id de cargo que será necessário`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const newnameboteN2 = new TextInputBuilder()
                        .setCustomId('tokenMP2')
                        .setLabel(`VALOR MÍNIMO DE COMPRA`)
                        .setPlaceholder(`Insira um valor mínimo necessário`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const newnameboteN4 = new TextInputBuilder()
                        .setCustomId('tokenMP3')
                        .setLabel(`VALOR MÁXIMO DE COMPRA`)
                        .setPlaceholder(`Insira um valor máximo necessário`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    if (gggaaa.condicao?.idcargo !== undefined) {
                        newnameboteN.setValue(`${gggaaa.condicao.idcargo}`);
                    }
                    if (gggaaa.condicao?.valorminimo !== undefined) {
                        newnameboteN2.setValue(`${gggaaa.condicao.valorminimo}`);
                    }
                    if (gggaaa.condicao?.valormaximo !== undefined) {
                        newnameboteN4.setValue(`${gggaaa.condicao.valormaximo}`);
                    }

                    const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                    const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                    const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);

                    modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5);
                    await interaction.showModal(modalaAA);
                }
                
                if (selectedValue === 'gerenciar_estoque') {
                    MessageStock(interaction, 1, ggg.name, ggg.camposelect, true, false);
                }
            }
        }

        if (interaction.isButton()) {

            if (interaction.customId == 'cleanestoquecampos') {

                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju11124124111231idsjjs123dua123')
                    .setTitle(`Limpar o estoque`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`CONFIRMAÇÃO`)
                    .setPlaceholder(`Digite "sim" para apagar todo estoque.`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)



                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                modalaAA.addComponents(firstActionRow3);
                await interaction.showModal(modalaAA);

            }




            if (interaction.customId == 'estoquefantasma') {


                const modalaAA = new ModalBuilder()
                    .setCustomId('sd1213aju11111idsjjsdua')
                    .setTitle(`Adicionando estoque fantasma`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`Quantidade`)
                    .setPlaceholder(`Insira aqui a quantidade de estoque fantasma desejada`)

                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`Valor fantasma (OPCIONAL)`)
                    .setPlaceholder(`Insira aqui um valor fantasma, ex: abra ticket para resgatar`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);


                modalaAA.addComponents(firstActionRow3, firstActionRow4);

                await interaction.showModal(modalaAA);


            }





            if (interaction.customId == `estoquearquivo`) {
                const ggg = await db.get(interaction.message.id)
                const umMinutoEmMilissegundos = 1 * 60 * 1000;
                const timeStamp = Date.now() + umMinutoEmMilissegundos;

                interaction.reply({ flags: 64, content: `${Emojis.get(`info`)} Envie um ou mais arquivo de texto contendo o estoque que deseja adicionar, expira <t:${Math.ceil(timeStamp / 1000)}:R>.` }).then(msgggg => {
                    const filter = message => message.author.id === interaction.user.id
                    const collector = interaction.channel.createMessageCollector({ filter: filter, time: 60000 })

                    collector.on('collect', async (message) => {
                        const axios = require('axios');
                        if (message.attachments.size !== 0) {
                            try {
                                await message.delete()
                            } catch (error) {

                            }

                            collector.stop()

                            await interaction.editReply({ embeds: [], components: [], content: '🔄 Aguarde...' })
                            const [attachmentId, attachmentInfo] = message.attachments.entries().next().value;
                            axios.get(attachmentInfo.attachment).then(async response => {


                                const lines = response.data.split('\n');

                                const linhasNaoVazias = [];
                                lines.forEach((linha, index) => {
                                    if (!linha.trim()) {
                                        return;
                                    }

                                    linhasNaoVazias.push(linha.trim());

                                })


                                const row4 = new ActionRowBuilder()
                                    .addComponents(

                                        new ButtonBuilder()
                                            .setCustomId("simestoque")
                                            .setLabel('Sim')
                                            .setEmoji(`1178076954029731930`)
                                            .setStyle(3),

                                        new ButtonBuilder()
                                            .setCustomId("definirlimitador")
                                            .setLabel('Definir delimitador')
                                            .setEmoji(`1178317298793205851`)
                                            .setStyle(2)
                                    )

                                await interaction.editReply({
                                    components: [row4],
                                    content: `Total de \`${linhasNaoVazias.length}\` itens detectados, cada item será adicionado como um produto no estoque de \`${ggg.camposelect}\`, exemplo:\`\`\`${linhasNaoVazias[0]}\`\`\`\nEsse valor será entregue como **uma** unidade para o cliente.\n**Deseja adicionar o valor de \`${linhasNaoVazias.length}\` itens ao estoque de \`${ggg.camposelect}\`?**`,
                                    flags: 64
                                }).then(async msg222 => {
                                    await db.set(`${interaction.user.id}.delimitadorStock`, { estoque: linhasNaoVazias.join(`\n`), delimitador: null, produto: ggg.name, campo: ggg.camposelect });
                                });


                            })

                        }
                    })

                    collector.on(`end`, async (message) => {
                        collector.stop()
                        if (message.size >= 1) return

                        msgggg.edit({ content: `${Emojis.get(`negative`)} Tempo esgotado ;)` })
                    })
                })

            }



            if (interaction.customId == 'cargosremadd') {

                const ggg = await db.get(interaction.message.id);
                const hhhh = produtos.get(`${ggg.name}.Campos`);
                const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect);


                const modalaAA = new ModalBuilder()
                    .setCustomId('dassdadassddsdasddassddasd')
                    .setTitle(`Definir cargos`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`CARGO PARA ADICIONAR APÓS COMPRA`)
                    .setPlaceholder(`Insira o id de algum cargo`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(gggaaa.roleadd || '')
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`CARGO PARA REMOVER APÓS COMPRA`)
                    .setPlaceholder(`Insira o id de algum cargo`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(gggaaa.rolerem || '')
                    .setRequired(false)

                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow52 = new ActionRowBuilder().addComponents(newnameboteN2);



                modalaAA.addComponents(firstActionRow5, firstActionRow52);
                await interaction.showModal(modalaAA);








            }



            if (interaction.customId == `simestoque`) {
                await interaction.update({ content: `${Emojis.get(`loading`)} Aguarde...`, components: [] })
                let estoque
                const ggg = await db.get(`${interaction.user.id}.delimitadorStock`)
                if (ggg.delimitador !== null) {
                    const linhasSeparadas = ggg.estoque.split(ggg.delimitador);
                    estoque = linhasSeparadas.map(item => item.trim()).filter(item => item !== '');


                } else {
                    estoque = ggg.estoque.split(`\n`);
                }


                const hhhh = produtos.get(`${ggg.produto}.Campos`)
                const campoParaAtualizar = hhhh.find(campo => campo.Nome === ggg.campo);


                campoParaAtualizar.estoque.push(...estoque);


                await produtos.set(`${ggg.produto}.Campos`, hhhh)
                await produtos.set(`${ggg.produto}.UltimaReposicao`, Date.now())


                await interaction.editReply({ content: `${Emojis.get(`loading`)} Atualizando estoque...`, components: [] }).then(async msg => {


                })

                await interaction.editReply({ content: `${Emojis.get(`loading`)} Sincronizando mensagens...`, flags: 64 })
                await UpdateMessageProduto(client, ggg.produto)

                
                try {
                    const stockTotalAtualizado = campoParaAtualizar.estoque.length;
                    const _mensP = produtos.get(`${ggg.produto}.mensagens`) || [];
                    notificarStockAdicionado(client, ggg.produto, ggg.campo, estoque.length, stockTotalAtualizado, _mensP).catch(() => {});
                } catch (e) {}

                const ggggg = campoParaAtualizar?.avisar;

                const buttonEnabled = ggggg?.length > 0;



                const row3 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`avisarestoqueeeee_${ggg?.produto}_${ggg?.campo}_${estoque.length}`)
                            .setLabel(`Avisar ${ggggg?.length || 0} usuário(s) (Com atalho de compra)`)
                            .setEmoji(`1178068047202893869`)
                            .setStyle(2)
                            .setDisabled(!buttonEnabled)
                    );


                await interaction.editReply({
                    components: [row3], content: `${Emojis.get(`checker`)} Estoque de ${ggg.campo} atualizado.`
                })

            }


            if (interaction.customId.startsWith(`avisarestoqueeeee`)) {

                const regex = /avisarestoqueeeee_(.*?)_(.*)_(.*)/;
                const correspondencias = interaction.customId.match(regex);

                const produto = correspondencias[1];
                const campo = correspondencias[2];
                const qtd = correspondencias[3];


                const hhhh2 = produtos.get(`${produto}`)

                const hhhh = produtos.get(`${produto}.Campos`)
                const gggaaa = hhhh.find(campo22 => campo22.Nome === campo)


                const yy = gggaaa.avisar

                if (yy == 0 || yy == undefined) return interaction.update({ content: `${Emojis.get(`negative`)} Nenhum usuário para avisar.`, flags: 64, components: [] })

                yy.forEach(async element => {
                    try {
                        const member = await client.users.fetch(element)
                        const channela = await client.channels.fetch(hhhh2.mensagens[0].channelid);

                        const row4 = new ActionRowBuilder()
                            .addComponents(

                                new ButtonBuilder()
                                    .setURL(`https://discord.com/channels/${hhhh2.mensagens[0].guildid}/${hhhh2.mensagens[0].channelid}/${hhhh2.mensagens[0].mesageid}`)
                                    .setLabel(`Comprar Produto`)
                                    .setEmoji(Emojis.get(`caixagrande`) || '📦')
                                    .setStyle(5)
                            )


                        await member.send({ components: [row4], content: `# ${gggaaa.Nome} Foi reeabastecido!\n- Olá <@${element}>, vim lhe anunciar que graças ao \`${interaction.user.username}\`, o produto \`${gggaaa.Nome}\` teve \`${qtd}\` itens reeabastecidos.` })
                    } catch (error) {

                    }


                });

                interaction.update({ content: `${Emojis.get(`checker`)} Avisamos os ${yy.length} que seu produto foi reabastecido com sucesso!`, flags: 64, components: [] })

                gggaaa.avisar = []
                produtos.set(`${produto}.Campos`, hhhh)

            }

            if (interaction.customId == 'definirlimitador') {
                const ggg = await db.get(`${interaction.user.id}.delimitadorStock`)

                const modalaAA = new ModalBuilder()
                    .setCustomId('definirlimitadororrr')
                    .setTitle(`Definir delimitador personalisado`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`DELIMITADOR`)
                    .setPlaceholder(`Insira o seu delimitador`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                if (ggg.delimitador !== null) {
                    newnameboteN.setValue(`${ggg.delimitador}`)
                }



                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                modalaAA.addComponents(firstActionRow3);
                await interaction.showModal(modalaAA);







            }


            if (interaction.customId == 'addestoque1') {

                const modalaAA = new ModalBuilder()
                    .setCustomId('addestoquemodalaaa')
                    .setTitle(`Adicionando estoque`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`Estoque`)
                    .setPlaceholder(`Insira aqui o estoque que deseja adicionar, um abaixo do outro.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(4000)

                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN);



                modalaAA.addComponents(firstActionRow5);
                await interaction.showModal(modalaAA);



            }


            if (interaction.customId == `estoquedsadas`) {
                const ggg = await db.get(interaction.message.id)
                const hhhh = produtos.get(`${ggg.name}.Campos`)

                const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect)


                if (gggaaa.estoque == 0) {
                    interaction.reply({ content: `${Emojis.get(`negative`)} O estoque desse item está vazio.`, flags: 64 })
                } else {


                    await interaction.reply({ content: `${Emojis.get(`loading`)} Aguarde...`, flags: 64 }).then(async tt => {
                        const conteudoEstoque = gggaaa.estoque.join('\n');
                        const fileName = `stock_${ggg.camposelect}.txt`;
                        const fileBuffer = Buffer.from(conteudoEstoque, 'utf-8');


                        await tt.edit({
                            flags: 64, files: [{
                                attachment: fileBuffer,
                                name: fileName
                            }],
                            content: `Estoque anexado na mensagem abaixo, total de \`${gggaaa.estoque.length}\` itens. `
                        })


                    })



                }
            }


            if (interaction.customId == 'addestoquecampos') {


                MessageStock(interaction)
            }

            if (interaction.customId == `excluirproduto`) {
                const ggg = await db.get(interaction.message.id)

                await produtos.delete(`${ggg.name}`)
                await Gerenciar2(interaction, client)
                interaction.followUp({ content: `${Emojis.get(`checker`)} | Produto excluído com sucesso!`, flags: 64 })
            }


            if (interaction.customId == 'gwdawdwadawawderenciarcampossss') {

                const ggg = await db.get(interaction.message.id)
                const hhhh = produtos.get(`${ggg.name}.Campos`)

                const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect)


                const modalaAA = new ModalBuilder()
                    .setCustomId('definircondicoes')
                    .setTitle(`Definir condições`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`ID DO CARGO`)
                    .setPlaceholder(`Insira algum id de cargo que será necessário`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`VALOR MÍNIMO DE COMPRA`)
                    .setPlaceholder(`Insira um valor mínimo necessário`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`VALOR MÁXIMO DE COMPRA`)
                    .setPlaceholder(`Insira um valor máximo necessário`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                if (gggaaa.condicao?.idcargo !== undefined) {
                    newnameboteN.setValue(`${gggaaa.condicao.idcargo}`)
                }

                if (gggaaa.condicao?.valorminimo !== undefined) {
                    newnameboteN2.setValue(`${gggaaa.condicao.valorminimo}`)
                }

                if (gggaaa.condicao?.valormaximo !== undefined) {
                    newnameboteN4.setValue(`${gggaaa.condicao.valormaximo}`)
                }


                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);





                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5);
                await interaction.showModal(modalaAA);


            }




            if (interaction.customId == 'editarcampooo') {

                const ggg = await db.get(interaction.message.id)
                const hhhh = produtos.get(`${ggg.name}.Campos`)

                const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.camposelect)

                const modalaAA = new ModalBuilder()
                    .setCustomId('configcampoo')
                    .setTitle(`Editando o campo`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`NOME DO CAMPO`)
                    .setPlaceholder(`Insira o nome desejado`)
                    .setValue(`${gggaaa.Nome}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId(`tokenMP2`)
                    .setLabel(`PREÇO DO CAMPO`)
                    .setPlaceholder(`Insira um preço desejado (BRL)`)
                    .setValue(`${Number(gggaaa.valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
              
              const newnameboteN24 = new TextInputBuilder()
                    .setCustomId('tokenMP7')
                    .setLabel(`Ponha um emoji`)
                    .setPlaceholder(`ponha um emoji (apenas o id)`)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(20)
                    .setRequired(false)    

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`DESCRIÇÃO DO CAMPO (OPCIONAL)`)
                    .setPlaceholder(`Insira um descrição desejada`)
                    .setStyle(TextInputStyle.Paragraph)

                    .setMaxLength(4000)
                    .setRequired(false)



                if (gggaaa.desc !== '') {
                    newnameboteN4.setValue(gggaaa.desc)
                }



                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow24 = new ActionRowBuilder().addComponents(newnameboteN24);





                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5,firstActionRow24);
                await interaction.showModal(modalaAA);

            }
        }
    }
}