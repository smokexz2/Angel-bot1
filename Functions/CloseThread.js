const { EmbedBuilder } = require('discord.js');
const { carrinhos, pagamentos, configuracao } = require('../database');


const avisosEnviados = new Set();

function CloseThreds(client) {
    client.guilds.cache.forEach((guild) => {
        const hilos = guild.channels.cache.filter((channel) => {
            return channel.isThread() && channel.name.includes('🛒');
        });

        hilos.forEach(async element => {
            try {
                const carrinho = carrinhos.get(element.id);
                if (!carrinho) return; 

                const lastActivity = carrinho.lastActivity || carrinho.criadoEm || element._createdTimestamp;
                const inatividade = Date.now() - lastActivity;
                const DEZ_MINUTOS = 10 * 60 * 1000;
                const DOZE_MINUTOS = 12 * 60 * 1000;

                
                if (inatividade >= DEZ_MINUTOS && inatividade < DOZE_MINUTOS && !avisosEnviados.has(element.id)) {
                    avisosEnviados.add(element.id);

                    const texto = element.name;
                    const partes = texto.split('・');
                    const userId = partes[partes.length - 1];

                    try {
                        const user = await client.users.fetch(userId);
                        const embed = new EmbedBuilder()
                            .setColor(configuracao.get('Cores.Erro') || '#ff8800')
                            .setTitle('Inatividade Detectada no Carrinho')
                            .setDescription(
                                'Seu carrinho está aberto há **10 minutos** sem atividade.\n\n' +
                                '> Retorne ao carrinho para continuar a compra.\n' +
                                '> **Se não houver atividade em 2 minutos, o carrinho será fechado automaticamente.**'
                            )
                            .setFooter({ text: guild.name });

                        await user.send({ embeds: [embed] });
                    } catch (e) {}

                    return; 
                }

                
                if (inatividade >= DOZE_MINUTOS) {
                    avisosEnviados.delete(element.id);
                    pagamentos.delete(element.id);
                    carrinhos.delete(element.id);

                    const texto = element.name;
                    const partes = texto.split('・');
                    const userId = partes[partes.length - 1];

                    
                    try {
                        const user = await client.users.fetch(userId);
                        const embed = new EmbedBuilder()
                            .setColor(configuracao.get('Cores.Erro') || '#ff0000')
                            .setTitle('🛑 Carrinho Fechado por Inatividade')
                            .setDescription(
                                'Seu carrinho foi **fechado por inatividade** (12 minutos sem atividade).\n\n' +
                                '> Você pode abrir um novo carrinho a qualquer momento para continuar.'
                            )
                            .setFooter({ text: guild.name });
                        await user.send({ embeds: [embed] });
                    } catch (e) {}

                    
                    try {
                        const channela = await client.channels.fetch(configuracao.get('ConfigChannels.logpedidos'));
                        if (channela) {
                            const embed = new EmbedBuilder()
                                .setColor(configuracao.get('Cores.Erro') || '#ff0000')
                                .setTitle('Carrinho expirado.')
                                .setDescription(`O carrinho de <@!${userId}> foi fechado por inatividade (12 minutos).`);
                            await channela.send({ embeds: [embed] });
                        }
                    } catch (e) {}

                    
                    try { await element.delete(); } catch (e) {}
                }
            } catch (err) {}
        });
    });
}

module.exports = { CloseThreds };