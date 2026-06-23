const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Emojis } = require("../database");
const { res } = require("../res");

function getEmojiObject(emojiStr) {
    if (!emojiStr || emojiStr === "") return { name: "⚙️" };
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return { name: emojiStr };
}

async function automatico(interaction, client) {
    const rowVoltar = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setCustomId("voltar1").setLabel('Voltar').setStyle(2); const e = Emojis.get('_back_emoji'); if (e) b.setEmoji(e); return b; })()
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ações Automáticas` },
        { type: 14 },
        { type: 10, content: `**Sistemas Automáticos**\n> Configure funcionalidades inteligentes que tornarão seu bot mais eficiente.` },
        { type: 14 },
        { type: 10, content: `**Opções Disponíveis**\n>  **Repostagem Automática** - Republique produtos automaticamente\n>  **Configurar Mensagens Automáticas** - Envie mensagens em intervalos\n>  **Lock Automático** - Bloqueie/desbloqueie canais por horário\n>  **Monitorador de Feedbacks** - Monitore avaliações *(Em desenvolvimento)*` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "select_acoes_automaticas",
                placeholder: "Selecione uma ação automática",
                options: [
                    {
                        label: "Repostagem Automática",
                        value: "automaticRepostar",
                        description: "Republique produtos automaticamente",
                        emoji: { id: "1384035219874779147" }
                    },
                    {
                        label: "Configurar Mensagens Automáticas",
                        value: "configMensagensAuto",
                        description: "Envie mensagens em intervalos",
                        emoji: { id: "1459059825483714665" }
                    },
                    {
                        label: "Lock Automático",
                        value: "configlock",
                        description: "Bloqueie/desbloqueie canais por horário",
                        emoji: { id: "1459059758353879093" }
                    },
                    {
                        label: "Monitorador de Feedbacks",
                        value: "monitorfeedbacks",
                        description: "Em desenvolvimento",
                        emoji: { id: "1459059777916243969" }
                    },
                    {
                        label: "Sistema de Sugestões",
                        value: "sistemasugestoes",
                        description: "Configure o sistema de sugestões",
                        emoji: { id: "1442998912347672687" }
                    },
                    {
                        label: "Sistema de Verificação",
                        value: "sistemaverificacao",
                        description: "Verificação por captcha de imagem",
                        emoji: { name: "🛡️" }
                    },
                    {
                        label: "GIFs Automáticos",
                        value: "sistemagifs",
                        description: "Despacha GIFs/mídias automaticamente",
                        emoji: { name: "📡" }
                    },
                    {
                        label: "Formulário Staff",
                        value: "sistemaformulario",
                        description: "Formulário de inscrição para staff",
                        emoji: { name: "📋" }
                    }
                ]
            }]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
        await interaction.editReply(containerContent);
    } catch (e) {
        try { await interaction.followUp({ content: '❌ Erro ao abrir painel de ações automáticas.', flags: 64 }); } catch {}
    }
}

module.exports = {
    automatico
};