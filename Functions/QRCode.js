const { ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
const { produtos, configuracao, Emojis } = require("../database");
const { res } = require("../res");
let Jimp = null;
try { Jimp = require("jimp"); } catch { console.warn("[QRCode] jimp não disponível."); } 
const QRCode = require("qrcode");

async function configqrcode(interaction, client) {

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`qrcode-button`)
      .setLabel(`Trocar Logo Qrcode`)
      .setEmoji(`1238299494181896306`)
      .setStyle(1)
  )

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`qrcode-colors`)
      .setLabel(`Editar Cores`)
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId(`qrcode-teste`)
      .setLabel(`Testar`)
      .setStyle(2),
  )

  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar3")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  const containerContent = res.main(
    { type: 10, content: `Aqui, você pode escolher o logo da sua marca, que será exibido nos QRCodes de pagamento criados.` }
  ).with({
    components: [row1, row2, botoesvoltar],
    flags: [64]
  });

  if (interaction.message) {
    await interaction.update(containerContent)
  }
}

async function TestarQRCode(interaction, client) {
  await interaction.reply({
    content: `${Emojis.get(`loading`)} Aguarde...`,
    flags: 64,
    components: [],
    embeds: []
  });

  const valor = 10.00;
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136teste@pix.com.br520400005303986540510.005802BR5913Nome Teste6009Sao Paulo62140510BOTDISCORD6304ABCD`;

  try {
    const qrBase64 = await QRCode.toDataURL(pixCode, {
      errorCorrectionLevel: 'H',
      width: 500
    });

    const qrImage = await Jimp.read(Buffer.from(qrBase64.split(',')[1], 'base64'));

    const logo = await Jimp.read('./Lib/aaaaa.png');
    logo.resize(100, 100);

    const x = (qrImage.bitmap.width / 2) - (logo.bitmap.width / 2);
    const y = (qrImage.bitmap.height / 2) - (logo.bitmap.height / 2);
    qrImage.composite(logo, x, y);

    const qrBuffer = await qrImage.getBufferAsync(Jimp.MIME_PNG);
    const attachment = new AttachmentBuilder(qrBuffer, { name: "qrcode.png" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("codigocopiaecola")
        .setLabel("Código copia e cola")
        .setDisabled(true)
        .setStyle(2),
      new ButtonBuilder()
        .setCustomId("cancelar_pagamento")
        .setLabel("Cancelar")
        .setDisabled(true)
        .setStyle(4)
    );

    const containerContent = res.main(
      { 
        type: 12, 
        items: [{ media: { url: "attachment://qrcode.png" }, spoiler: false }] 
      },
      { type: 14 },
      { type: 10, content: `${Emojis.get("pix_stamp_emoji")} **Pagamento via PIX simulado**` },
      { type: 14 },
      { type: 10, content: `> ${Emojis.get("money_emoji")} **Valor:** R$ ${valor.toFixed(2)}\n> ${Emojis.get("time_emoji")} **Expira em:** ⏳ 15 segundos` },
      { type: 14 },
      { type: 10, content: `> ${Emojis.get("information_emoji")} **Código Copia e Cola:**\n\`\`\`${pixCode}\`\`\`` }
    ).with({
      components: [row],
      files: [attachment],
      flags: [64]
    });

    await interaction.editReply(containerContent);

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (err) {
        console.error("Erro ao apagar mensagem:", err);
      }
    }, 15000);

  } catch (err) {
    console.error("Erro ao gerar QR Code com logo:", err);
    return interaction.editReply({
      content: `${Emojis.get("negative")} Ocorreu um erro ao gerar o QR Code com logo.`,
      flags: 64
    });
  }
}

module.exports = {
  configqrcode,
  TestarQRCode
}