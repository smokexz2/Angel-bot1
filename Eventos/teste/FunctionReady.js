const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ActivityType } = require('discord.js');
const { carregarCache } = require('../../Handler/EmojiFunctions');
const { VerificarPagamento } = require('../../Functions/VerficarPagamento');
const { EntregarPagamentos } = require('../../Functions/AprovarPagamento');
const { VerificarPagamentoRobux } = require('../../Functions/VerificarPagamentoRobux');
const { configuracao } = require('../../database');
const { SincronizarDados } = require('../../Functions/SincronizarDados.js');
const { restart } = require('../../Functions/Restart.js');
const { Varredura } = require('../../Functions/Varredura.js');

module.exports = {
    name: 'ready',

    run: async (client) => {
        console.clear();

        
        async function SincronizarComSite() {
            try {
                const guild = client.guilds.cache.first(); 
                if (!guild) return;

                const channel = guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(client.user).has('CreateInstantInvite'));
                let inviteUrl = "https://discord.gg/8uRUUrMrCf";
                
                if (channel) {
                    const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: true }).catch(() => null);
                    if (invite) inviteUrl = `https://discord.gg/${invite.code}`;
                }

                const dados = {
                    id: guild.id,
                    nome: guild.name,
                    membros: guild.memberCount,
                    online: Math.floor(guild.memberCount * 0.25),
                    icone: guild.iconURL({ extension: 'png', size: 512 }) || 'https://cdn.discordapp.com/embed/avatars/0.png',
                    convite: inviteUrl
                };

                await axios.post('https://NobSupply.com.br/api/servidores/registrar', dados, {
                    headers: { 'Authorization': 'galaodamassa581' }
                });
                console.log(`\x1b[32m[Manager]\x1b[0m Site atualizado: ${guild.name}`);
            } catch (err) {
                console.error("❌ Erro ao atualizar site:", err.message);
            }
        }

        
        await SincronizarComSite();
        setInterval(SincronizarComSite, 10800000);

        
        const statusList = ['Vendas on', 'WinnBuxx'];
        let indiceAtual = 0;
        setInterval(() => {
            client.user.setActivity(statusList[indiceAtual], { type: ActivityType.Streaming, url: 'https://www.twitch.tv/discord' });
            indiceAtual = (indiceAtual + 1) % statusList.length;
        }, 5000);

        
        if (client.guilds.cache.size > 1) {
            client.guilds.cache.forEach(guild => {
                if(guild.id !== "") guild.leave().catch(() => null);
            });
        }

        
        const resetCarrinhos = () => fs.writeFileSync(path.resolve(__dirname, '../../database/carrinhos.json'), '{}');
        const updateBio = () => client.application.edit({ description: 'Bot oficial da **WinnBuxx**\nhttps://discord.gg/zkHSZAVA2e\n\nProdutos baratos praticamente de graça!\nMelhores preços de robux do mercado!\n\n`by Thebestxuuil`' }).catch(() => null);

        await updateBio();
        resetCarrinhos();
        
        setInterval(() => VerificarPagamento(client), 10000);
        setInterval(() => EntregarPagamentos(client), 14000);
        setInterval(() => VerificarPagamentoRobux(client), 10000);

        restart(client);
        Varredura(client).catch(err => console.error('[Varredura] Erro:', err.message));
        SincronizarDados(client);
        setInterval(() => SincronizarDados(client), 7200000);
        setInterval(() => Varredura(client).catch(err => console.error('[Varredura] Erro:', err.message)), 86400000);

        console.log(`\x1b[36m[Log]\x1b[0m ${client.user.tag} Online e Sincronizado!`);
        carregarCache();
    }
};