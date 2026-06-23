const { MessageFlags } = require("discord.js");
const { configuracao, Emojis } = require("../database");
const { res } = require("../res");
const fs = require("fs");
const path = require("path");
const https = require("https");
const axios = require("axios");

function mask(value) {
    if (!value) return "Não configurado";
    const text = String(value);
    if (text.length <= 10) return text;
    return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

function getText(interaction, id) {
    try {
        return interaction.fields.getTextInputValue(id);
    } catch {}
    const components = interaction?.data?.components || interaction?.components || [];
    for (const item of components) {
        const component = item.component || item.components?.[0];
        if (component?.custom_id === id || component?.customId === id) return component.value || "";
    }
    return "";
}

function getUploadedAttachment(interaction, id) {
    try {
        const files = interaction.fields?.getUploadedFiles?.(id, false);
        if (files?.size) return files.first();
    } catch {}
    try {
        const field = interaction.fields?.getField?.(id);
        const attachmentId = field?.values?.[0] || field?.value?.[0] || field?.value;
        const resolved = interaction.fields?.resolved?.attachments || interaction.resolved?.attachments || interaction.data?.resolved?.attachments;
        if (attachmentId && resolved?.get) return resolved.get(attachmentId);
        if (attachmentId && resolved) return resolved[attachmentId];
    } catch {}
    if (interaction.attachments?.size) return interaction.attachments.first();
    const resolved = interaction?.data?.resolved?.attachments || interaction?.resolved?.attachments || interaction.fields?.resolved?.attachments;
    const components = interaction.fields?.components || interaction?.data?.components || interaction?.components || [];
    let attachmentId = null;
    const walk = (items) => {
        for (const item of items || []) {
            const component = item.component || item.components?.[0] || item;
            if (component?.custom_id === id || component?.customId === id) attachmentId = component.values?.[0] || component.value?.[0] || component.value || null;
            if (item.components) walk(item.components);
            if (item.component?.components) walk(item.component.components);
        }
    };
    walk(components);
    if (!attachmentId || !resolved) return null;
    if (resolved instanceof Map || resolved?.get) return resolved.get(attachmentId);
    return resolved[attachmentId] || null;
}


async function saveCertificate(file) {
    const name = file.name || file.filename || "certificado.p12";
    const url = file.url || file.proxyURL || file.proxy_url;
    if (!url) throw new Error("certificate_url_missing");
    if (!name.toLowerCase().endsWith(".p12")) throw new Error("certificate_invalid_extension");
    const libPath = path.join(__dirname, "..", "Lib");
    if (!fs.existsSync(libPath)) fs.mkdirSync(libPath, { recursive: true });
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const certificateName = safeName.replace(/\.p12$/i, "");
    const certificatePath = path.join(libPath, `${certificateName}.p12`);
    const response = await axios.get(url, { responseType: "arraybuffer", headers: { Accept: "application/octet-stream" } });
    fs.writeFileSync(certificatePath, Buffer.from(response.data));
    return { certificateName, certificatePath };
}

async function validateEfi(clientid, clientsecret, certificatePath, chavepix) {
    const certificadoBuffer = fs.readFileSync(certificatePath);
    const authData = Buffer.from(`${clientid}:${clientsecret}`).toString("base64");
    const agent = new https.Agent({ pfx: certificadoBuffer, passphrase: "" });
    const tokenResponse = await axios.post("https://pix.api.efipay.com.br/oauth/token", { grant_type: "client_credentials" }, {
        headers: { Authorization: `Basic ${authData}`, "Content-Type": "application/json" },
        httpsAgent: agent
    });
    const accessToken = tokenResponse.data.access_token;
    if (chavepix) return chavepix;
    const chavesPixResponse = await axios.get("https://pix.api.efipay.com.br/v2/gn/evp", {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        httpsAgent: agent
    });
    if (chavesPixResponse.data.chaves?.length) return chavesPixResponse.data.chaves[0];
    const novaChaveResponse = await axios.post("https://pix.api.efipay.com.br/v2/gn/evp", {}, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        httpsAgent: agent
    });
    return novaChaveResponse.data.chave;
}

async function efiConfigs(interaction) {
    const sistema = configuracao.get("pagamentos.sistema_efi") ? "🟢 Habilitado" : "🔴 Desabilitado";
    const secretToken = configuracao.get("pagamentos.secret_token");
    const secretId = configuracao.get("pagamentos.secret_id");
    const certificado = configuracao.get("pagamentos.certificado");
    const chavePix = configuracao.get("pagamentos.chavepix");
    const statusCredenciais = secretToken && secretId && certificado && chavePix ? "🟢 Completo" : secretToken || secretId || certificado || chavePix ? "🟡 Incompleto" : "🔴 Não configurado";
    const containerContent = res.main(
        { type: 10, content: `## ${Emojis.get("efi") || "🏦"} Configurar Efi Bank\n> Configure Client ID, Client Secret, chave Pix e certificado .p12 no fluxo moderno com upload de arquivo.` },
        { type: 14 },
        { type: 10, content: `> **Sistema:** \`${sistema}\`\n> **Credenciais:** \`${statusCredenciais}\`\n> **Client ID:** \`${mask(secretId)}\`\n> **Client Secret:** \`${secretToken ? "Configurado" : "Não configurado"}\`\n> **Chave Pix:** \`${mask(chavePix)}\`\n> **Certificado:** \`${certificado ? `${certificado}.p12` : "Não configurado"}\`` },
        { type: 14 },
        { type: 1, components: [
            { type: 2, style: 2, label: "Configurar Efi Bank", custom_id: "efi_alterar_credenciais", emoji: { name: "✏️" } },
            { type: 2, style: configuracao.get("pagamentos.sistema_efi") ? 3 : 4, label: configuracao.get("pagamentos.sistema_efi") ? "Desabilitar" : "Habilitar", custom_id: "efi_toggle_sistema", emoji: { name: "⚙️" } }
        ] },
        { type: 14 },
        { type: 1, components: [{ type: 2, style: 2, custom_id: "formasdepagamentos", label: "Voltar", emoji: { name: "↩️" } }] }
    ).with({ flags: [MessageFlags.Ephemeral] });
    if (interaction.isStringSelectMenu?.() || interaction.isButton?.()) return interaction.update(containerContent).catch(() => interaction.reply(containerContent));
    if (interaction.replied || interaction.deferred) return interaction.editReply(containerContent);
    return interaction.reply(containerContent);
}

async function efiToggleSistema(interaction) {
    configuracao.set("pagamentos.sistema_efi", !configuracao.get("pagamentos.sistema_efi"));
    return efiConfigs(interaction);
}

async function efiModalCredenciais(interaction) {
    return interaction.showModal({
        custom_id: "efi_modal_credenciais",
        title: "Configurar Efi Bank",
        components: [
            { type: 10, content: "Preencha as credenciais, informe a chave Pix e envie o certificado .p12." },
            { type: 18, label: "Client ID", description: "Credencial client_id da aplicação Efi", component: { type: 4, custom_id: "efi_clientid", style: 1, required: true, max_length: 200, value: `${configuracao.get("pagamentos.secret_id") || ""}` } },
            { type: 18, label: "Client Secret", description: "Credencial client_secret da aplicação Efi", component: { type: 4, custom_id: "efi_clientsecret", style: 1, required: true, max_length: 200, value: `${configuracao.get("pagamentos.secret_token") || ""}` } },
            { type: 18, label: "Chave Pix", description: "Chave Pix usada na cobrança Efi", component: { type: 4, custom_id: "efi_chavepix", style: 1, required: true, max_length: 200, value: `${configuracao.get("pagamentos.chavepix") || ""}` } },
            { type: 18, label: "Certificado .p12", description: "Selecione o certificado da aplicação Efi", component: { type: 19, custom_id: "efi_certificado_p12", min_values: 1, max_values: 1, required: true } }
        ]
    });
}

async function efiHandleModalCredenciais(interaction) {
    const clientid = getText(interaction, "efi_clientid").trim();
    const clientsecret = getText(interaction, "efi_clientsecret").trim();
    const chavepixInformada = getText(interaction, "efi_chavepix").trim();
    const file = getUploadedAttachment(interaction, "efi_certificado_p12");
    if (!clientid || !clientsecret || !chavepixInformada || !file) return interaction.reply({ content: `${Emojis.get("negative") || "❌"} Preencha Client ID, Client Secret, Chave Pix e selecione o certificado .p12.`, flags: MessageFlags.Ephemeral });
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
        const { certificateName, certificatePath } = await saveCertificate(file);
        const chavepix = await validateEfi(clientid, clientsecret, certificatePath, chavepixInformada);
        configuracao.set("pagamentos.certificado", certificateName);
        configuracao.set("pagamentos.secret_id", clientid);
        configuracao.set("pagamentos.chavepix", chavepix);
        configuracao.set("pagamentos.secret_token", clientsecret);
        await interaction.editReply({ content: `${Emojis.get("checker") || "✅"} Efi Bank configurado com sucesso.\n> **Chave Pix:** \`${chavepix}\`\n> **Certificado:** \`${certificateName}.p12\`` });
    } catch (error) {
        console.log("[EfiBank]", error.response?.data || error.message || error);
        await interaction.editReply({ content: `${Emojis.get("negative") || "❌"} Não consegui validar a Efi Bank. Confira Client ID, Client Secret, chave Pix e certificado .p12.` });
    }
}

module.exports = { efiConfigs, efiToggleSistema, efiModalCredenciais, efiHandleModalCredenciais };