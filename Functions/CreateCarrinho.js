const { 
    ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder 
} = require("discord.js");
const { DentroCarrinho1 } = require("./DentroCarrinho");
const { enviarLogJogo } = require("./GamepassProdutos");
const { carrinhos, configuracao, EmojisHelper } = require("../database");
const fs = require('fs');
const path = require(`path`);

const Emojis = EmojisHelper;


const dbPathAuth = path.join(__dirname, "..", "database", "configauth02api.json");
const REDIRECT_URL = "https://auth.ilusionsoluctions.com.br/auth02/verify";

function VerificaçõesCarrinho(infos) {
    if (infos.estoque <= 0) return { error: 400, message: `Sem Stock Disponível` };
    return { status: 202 };
}

async function CreateCarrinho(interaction, infos) {
    
    await interaction.reply({ 
        content: `${Emojis.get(`loading`)} Iniciando Verificações de Segurança...`, 
        flags: 64 
    });

    
    const isVerificacaoObrigatoria = configuracao.get(`Verificacaobrigatoria`) === "true";

    if (isVerificacaoObrigatoria) {
        if (!fs.existsSync(dbPathAuth)) {
            return interaction.editReply({ 
                content: `${Emojis.get(`negative`)} | Erro interno: Base de dados Auth não encontrada.` 
            });
        }

        const authDataRaw = JSON.parse(fs.readFileSync(dbPathAuth, `utf-8`));
        
        
        
        const botIds = Object.keys(authDataRaw);
        const configAuth = authDataRaw.bot_id ? authDataRaw : authDataRaw[botIds[0]];

        const roleID = configAuth?.role_id;
        const botClientID = configAuth?.bot_id;

        if (!roleID || !botClientID) {
            return interaction.editReply({ 
                content: `${Emojis.get(`negative`)} | O sistema exige verificação, mas as configurações de Auth estão incompletas no JSON.` 
            });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        
        if (!member.roles.cache.has(roleID)) {
            
            
            const linkFinal = `https://discord.com/api/oauth2/authorize?client_id=${configAuth.bot_id}&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&response_type=code&scope=identify%20guilds.join&state=${configAuth.bot_id}`;

            const rowVerify = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(linkFinal)
                    .setLabel(`Clique aqui para se verificar`)
                    .setStyle(ButtonStyle.Link)
            );

            const embedAviso = new EmbedBuilder()
                .setAuthor({ 
                    name: "Sistema de Segurança - Verificaçao nao Detectada", 
                    iconURL: "https://media.discordapp.net/attachments/1440171367483048057/1457419090233921547/alerta_vemelho.png?ex=695beecc&is=695a9d4c&hm=5834391a44e3fbe40a0f281cac3730307ffe4076fd3460f8a35f4e66483e8ffd&=&format=webp&quality=lossless" 
                })
                .setDescription(`> Este servidor requer que os membros estejam verificados para realizar compras Clique no botão abaixo e após concluir a verificação, tente comprar o produto novamente.`)
                .setColor("#2b2d31");

            return interaction.editReply({ 
                content: null,
                embeds: [embedAviso],
                components: [rowVerify]
            });
        }
    }

    
    await interaction.editReply({ 
        content: `${Emojis.get(`loading`)} Verificando disponibilidade no estoque...`, 
        embeds: [],
        components: [] 
    });

    const carrinhoStatus = VerificaçõesCarrinho(infos);
    if (carrinhoStatus.error) {
        return interaction.editReply({ 
            content: `${Emojis.get(`negative`)} | ${carrinhoStatus.message}` 
        });
    }

    
    const threadExistente = interaction.channel.threads.cache.find(x => x.name.includes(interaction.user.id));
    
    if (threadExistente) {
        const rowExistente = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${threadExistente.id}`)
                .setLabel(`Ir para o carrinho`)
                .setStyle(ButtonStyle.Link)
        );

        return interaction.editReply({ 
            content: `${Emojis.get(`negative`)} Você já possui um carrinho aberto.`, 
            components: [rowExistente] 
        });
    }

    
    try {
        const thread = await interaction.channel.threads.create({
            name: `🛒・${interaction.user.username}・${interaction.user.id}`,
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
        });

        const rowSucesso = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
                .setLabel(`Ir para o carrinho`)
                .setStyle(ButtonStyle.Link)
        );

        await interaction.editReply({ 
            content: `${Emojis.get(`checker`)} Carrinho criado com sucesso!`, 
            components: [rowSucesso] 
        });

        await carrinhos.set(thread.id, { 
            user: interaction.user, 
            guild: interaction.guild, 
            threadid: thread.id, 
            infos: infos,
            criadoEm: Date.now(),
            lastActivity: Date.now()
        });

        
        try {
            const rowDM = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
                    .setLabel('Ir para o carrinho')
                    .setStyle(ButtonStyle.Link)
            );

            const embedDM = new EmbedBuilder()
                .setAuthor({ 
                    name: 'Carrinho Criado com Sucesso!', 
                    iconURL: 'https://cdn.discordapp.com/emojis/1443332136139624598.png?size=2048' 
                })
                .setColor('#2b2d31')
                .setDescription(`Seu carrinho foi criado com sucesso e os seus produtos já estão nele. Verifique os detalhes abaixo.`)
                .addFields(
                    { name: `Informações do Pedido`, value: infos.tipo === "jogo" ? `> \`${infos.nome}\`` : `> \`${infos.produto} - ${infos.campo}\`` }
                )
                .setFooter({ 
                    text: `${interaction.guild.name} • Entrega automática após pagamento`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setTimestamp();
            
            await interaction.user.send({ embeds: [embedDM], components: [rowDM] });
        } catch (error) {
            
        }

        DentroCarrinho1(thread);

        
        if (infos.tipo === 'jogo') {
            try {
                await enviarLogJogo(thread.client, `carrinho_criado`, {
                    userId: interaction.user.id,
                    userTag: interaction.user.username || interaction.user.tag,
                    nome: infos.nome,
                    preco: infos.preco,
                    threadId: thread.id,
                });
            } catch(e) {}
        }

    } catch (error) {
        console.error(error);
        await interaction.editReply({ 
            content: `${Emojis.get(`negative`)} Erro ao criar canal. Verifique minhas permissões.` 
        });
    }
}

module.exports = {
    VerificaçõesCarrinho,
    CreateCarrinho
};