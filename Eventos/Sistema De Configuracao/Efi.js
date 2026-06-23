const { configuracao, Emojis } = require("../../database");
const { MessageFlags } = require("discord.js");
const { res } = require("../../res");
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

function walkValues(value, visitor, seen = new Set()) {
    if (value === null || value === undefined) return;
    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    visitor(value);
    if (value instanceof Map) {
        for (const item of value.values()) walkValues(item, visitor, seen);
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) walkValues(item, visitor, seen);
        return;
    }
    for (const key of Object.keys(value)) walkValues(value[key], visitor, seen);
}

function getUploadedAttachment(interaction, id) {
    try {
        const files = interaction.fields?.getUploadedFiles?.(id, false);
        if (files?.size) return files.first();
        if (Array.isArray(files) && files.length) return files[0];
    } catch {}
    try {
        const field = interaction.fields?.getField?.(id);
        const values = field?.values || field?.value || field?.data?.values;
        const attachmentId = Array.isArray(values) ? values[0] : values;
        const resolved = interaction.fields?.resolved?.attachments || interaction.resolved?.attachments || interaction.data?.resolved?.attachments;
        if (attachmentId && resolved?.get) return resolved.get(attachmentId);
        if (attachmentId && resolved) return resolved[attachmentId];
    } catch {}
    if (interaction.attachments?.size) return interaction.attachments.first();
    const raw = [];
    try { raw.push(interaction.toJSON?.()); } catch {}
    raw.push(interaction.data, interaction.fields, interaction.resolved);
    let attachmentId = null;
    let directAttachment = null;
    let attachments = null;
    for (const source of raw) {
        walkValues(source, (obj) => {
            const customId = obj.custom_id || obj.customId;
            if (customId === id) {
                const values = obj.values || obj.value || obj.data?.values || obj.data?.value;
                const first = Array.isArray(values) ? values[0] : values;
                if (first) attachmentId = String(first);
            }
            if (obj.attachments) attachments = obj.attachments;
            const name = obj.filename || obj.name;
            const url = obj.url || obj.proxy_url || obj.proxyURL;
            if (name && url && String(name).toLowerCase().endsWith('.p12')) directAttachment = obj;
        });
    }
    if (attachmentId && attachments) {
        if (attachments instanceof Map || attachments?.get) return attachments.get(attachmentId);
        if (attachments[attachmentId]) return attachments[attachmentId];
        if (Array.isArray(attachments)) return attachments.find(a => String(a.id) === attachmentId) || attachments[0];
    }
    return directAttachment;
}

async function downloadCertificate(file) {
    const name = file.name || file.filename || "certificado.p12";
    const url = file.url || file.proxyURL || file.proxy_url;
    if (!url) throw new Error("certificate_url_missing");
    if (!name.toLowerCase().endsWith(".p12")) throw new Error("certificate_invalid_extension");
    const libPath = path.join(__dirname, "..", "..", "Lib");
    if (!fs.existsSync(libPath)) fs.mkdirSync(libPath, { recursive: true });
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const certificateName = safeName.replace(/\.p12$/i, "");
    const certificatePath = path.join(libPath, `${certificateName}.p12`);
    const response = await axios.get(url, { responseType: "arraybuffer", headers: { Accept: "application/octet-stream" } });
    fs.writeFileSync(certificatePath, Buffer.from(response.data));
    return { certificateName, certificatePath };
}

async function validateCredentials(clientid, clientsecret, certificatePath, pixKey) {
    const certificadoBuffer = fs.readFileSync(certificatePath);
    const authData = Buffer.from(`${clientid}:${clientsecret}`).toString("base64");
    const agent = new https.Agent({ pfx: certificadoBuffer, passphrase: "" });
    const tokenResponse = await axios.post(
        "https://pix.api.efipay.com.br/oauth/token",
        { grant_type: "client_credentials" },
        {
            headers: {
                Authorization: `Basic ${authData}`,
                "Content-Type": "application/json"
            },
            httpsAgent: agent
        }
    );
    const accessToken = tokenResponse.data.access_token;
    if (pixKey) return pixKey;
    const chavesPixResponse = await axios.get("https://pix.api.efipay.com.br/v2/gn/evp", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        httpsAgent: agent
    });
    if (chavesPixResponse.data.chaves?.length) return chavesPixResponse.data.chaves[0];
    const novaChaveResponse = await axios.post("https://pix.api.efipay.com.br/v2/gn/evp", {}, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        httpsAgent: agent
    });
    return novaChaveResponse.data.chave;
}

async function EfiBank(interaction) {
    const sistema = configuracao.get("pagamentos.sistema_efi") ? "🟢 Habilitado" : "🔴 Desabilitado";
    const secretToken = configuracao.get("pagamentos.secret_token");
    const secretId = configuracao.get("pagamentos.secret_id");
    const certificado = configuracao.get("pagamentos.certificado");
    const chavePix = configuracao.get("pagamentos.chavepix");
    const credenciaisOk = secretToken && secretId && certificado && chavePix;
    const statusMessage = credenciaisOk ? "🟢 Completo" : secretToken || secretId || certificado || chavePix ? "🟡 Incompleto" : "🔴 Não configurado";
    const containerContent = res.main(
        { type: 10, content: `## ${Emojis.get("efi") || "🏦"} Efi Bank\n> Configure as credenciais Pix, a chave Pix e o certificado .p12 exigido pela Efi.` },
        { type: 14 },
        { type: 10, content: `> **Sistema:** \`${sistema}\`\n> **Status:** \`${statusMessage}\`\n> **Client ID:** \`${mask(secretId)}\`\n> **Client Secret:** \`${secretToken ? "Configurado" : "Não configurado"}\`\n> **Chave Pix:** \`${mask(chavePix)}\`\n> **Certificado:** \`${certificado ? `${certificado}.p12` : "Não configurado"}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Efi Bank", custom_id: "config_pagamentos_secretconfig", emoji: { name: "✏️" } },
                { type: 2, style: configuracao.get("pagamentos.sistema_efi") ? 3 : 4, label: configuracao.get("pagamentos.sistema_efi") ? "Desabilitar" : "Habilitar", custom_id: "config_pagamentos_efi_sistema", emoji: { name: "⚙️" } }
            ]
        },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Voltar", custom_id: "formasdepagamentos", emoji: { name: "↩️" } }
            ]
        }
    ).with({ flags: [MessageFlags.Ephemeral] });
    if (interaction.replied || interaction.deferred) return interaction.editReply(containerContent);
    if (interaction.isButton?.() || interaction.isStringSelectMenu?.()) return interaction.update(containerContent).catch(() => interaction.reply(containerContent));
    return interaction.reply(containerContent);
}

async function showEfiModal(interaction) {
    await interaction.showModal({
        custom_id: "alterarcredenciais",
        title: "Configurar Efi Bank",
        components: [
            { type: 10, content: "Preencha as credenciais da Efi, informe a chave Pix e envie o certificado .p12." },
            { type: 18, label: "Client ID", description: "Credencial client_id da aplicação Efi", component: { type: 4, custom_id: "clientid", style: 1, required: true, max_length: 200, value: `${configuracao.get("pagamentos.secret_id") || ""}` } },
            { type: 18, label: "Client Secret", description: "Credencial client_secret da aplicação Efi", component: { type: 4, custom_id: "clientsecret", style: 1, required: true, max_length: 200, value: `${configuracao.get("pagamentos.secret_token") || ""}` } },
            { type: 18, label: "Chave Pix", description: "Chave Pix que será usada para gerar cobranças", component: { type: 4, custom_id: "chavepix", style: 1, required: true, max_length: 200, value: `${configuracao.get("pagamentos.chavepix") || ""}` } },
            { type: 18, label: "Certificado .p12", description: "Selecione o certificado baixado no painel da Efi", component: { type: 19, custom_id: "certificado_p12", min_values: 1, max_values: 1, required: true } }
        ]
    });
}

async function handleEfiModal(interaction) {
    const clientid = getText(interaction, "clientid").trim();
    const clientsecret = getText(interaction, "clientsecret").trim();
    const chavepixInformada = getText(interaction, "chavepix").trim();
    const file = getUploadedAttachment(interaction, "certificado_p12");
    if (!clientid || !clientsecret || !chavepixInformada || !file) {
        return interaction.reply({ content: `${Emojis.get("negative") || "❌"} Preencha Client ID, Client Secret, Chave Pix e envie o certificado .p12.`, flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
        const { certificateName, certificatePath } = await downloadCertificate(file);
        const chavepix = await validateCredentials(clientid, clientsecret, certificatePath, chavepixInformada);
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

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        if (!interaction.customId) return;
        if (interaction.customId === "config_pagamentos_efi_sistema") {
            configuracao.set("pagamentos.sistema_efi", !configuracao.get("pagamentos.sistema_efi"));
            return EfiBank(interaction);
        }
        if (interaction.customId === "config_pagamentos_secretconfig") return showEfiModal(interaction);
        if (interaction.customId === "config_pagamentos_efibank") return EfiBank(interaction);
        if (interaction.customId === "alterarcredenciais") return handleEfiModal(interaction);
    }
};