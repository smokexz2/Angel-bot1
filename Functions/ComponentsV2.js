const { MessageFlags, BaseInteraction, TextInputBuilder, ActionRowBuilder, ModalBuilder } = require('discord.js');

const C = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  MentionableSelect: 7,
  ChannelSelect: 8,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  Separator: 14,
  File: 13,
  Container: 17,
  Label: 18,
  FileUpload: 19
};

const Flag = MessageFlags?.IsComponentsV2 ?? 32768;

function dataOf(value) {
  if (!value) return value;
  if (typeof value.toJSON === 'function') return value.toJSON();
  return value;
}

function text(value) {
  if (value === null || value === undefined) return '';
  return String(value).slice(0, 4000);
}

function td(content) {
  return { type: C.TextDisplay, content: text(content) || '\u200b' };
}

function sep() {
  return { type: C.Separator, divider: true, spacing: 1 };
}

function row(children) {
  return { type: C.ActionRow, components: children.map(dataOf).filter(Boolean) };
}

function normalizeEmoji(emoji) {
  if (!emoji) return emoji;
  if (typeof emoji === 'string') {
    const custom = emoji.match(/^<a?:([^:>]+):(\d+)>$/);
    if (custom) return { name: custom[1], id: custom[2], animated: emoji.startsWith('<a:') };
    if (/^\d{15,25}$/.test(emoji)) return { name: 'emoji', id: emoji };
    return { name: emoji };
  }
  if (emoji.id && (!emoji.name || /^\d{15,25}$/.test(String(emoji.name)))) return { ...emoji, name: 'emoji' };
  if (!emoji.id && emoji.name && /^\d{15,25}$/.test(String(emoji.name))) return { name: 'emoji', id: String(emoji.name) };
  return emoji;
}

function sanitizeComponent(component) {
  if (!component || typeof component !== 'object') return component;
  if (component.emoji) component.emoji = normalizeEmoji(component.emoji);
  if (Array.isArray(component.options)) {
    component.options = component.options.map(option => ({
      ...option,
      emoji: normalizeEmoji(option.emoji)
    }));
  }
  if (Array.isArray(component.components)) component.components = component.components.map(sanitizeComponent);
  return component;
}

function withContainerColor(component, index = 0) {
  if (component?.type === C.Container && component.accent_color === undefined) {
    component.accent_color = [0x5865f2, 0x57f287, 0xfee75c, 0xeb459e, 0x2b2d31][index % 5];
  }
  return component;
}

function normalizeComponent(component) {
  const json = sanitizeComponent(dataOf(component));
  if (!json) return null;
  if (json.type === C.ActionRow) return json;
  if ([C.Button, C.StringSelect, C.UserSelect, C.RoleSelect, C.MentionableSelect, C.ChannelSelect].includes(json.type)) return row([json]);
  return json;
}

function titleFromEmbed(embed) {
  const e = dataOf(embed) || {};
  const lines = [];
  if (e.author?.name) lines.push(`### ${e.author.name}`);
  if (e.title) lines.push(`## ${e.title}`);
  if (e.description) lines.push(e.description);
  if (Array.isArray(e.fields)) {
    for (const field of e.fields) {
      if (!field) continue;
      lines.push(`**${field.name || 'Campo'}**\n${field.value || '\u200b'}`);
    }
  }
  if (e.footer?.text) lines.push(`_${e.footer.text}_`);
  if (e.timestamp) lines.push(`_${new Date(e.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}_`);
  return lines.join('\n\n') || '\u200b';
}

function mediaFromEmbeds(embeds) {
  const items = [];
  for (const embed of embeds || []) {
    const e = dataOf(embed) || {};
    const image = e.image?.url || e.thumbnail?.url;
    if (image) items.push({ media: { url: image } });
  }
  return items.length ? { type: C.MediaGallery, items: items.slice(0, 10) } : null;
}

function fileComponents(files) {
  const list = [];
  for (const file of files || []) {
    const json = dataOf(file);
    const attachment = json?.attachment || json?.name || json?.path || json;
    const name = json?.name || json?.filename || (typeof attachment === 'string' ? attachment.split(/[\\/]/).pop() : 'arquivo');
    if (name) list.push({ type: C.File, file: { url: `attachment://${name}` } });
  }
  return list;
}

function flattenActionRows(components) {
  const rows = [];
  const others = [];
  for (const component of components || []) {
    const json = normalizeComponent(component);
    if (!json) continue;
    if (json.type === C.ActionRow) rows.push(json);
    else others.push(json);
  }
  return { rows, others };
}

function chunkComponents(items) {
  const chunks = [];
  let current = [];
  for (const item of items) {
    const size = 1 + (Array.isArray(item.components) ? item.components.length : 0);
    const currentSize = current.reduce((a, c) => a + 1 + (Array.isArray(c.components) ? c.components.length : 0), 0);
    if (current.length && currentSize + size > 35) {
      chunks.push(current);
      current = [];
    }
    current.push(item);
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function toV2Payload(payload) {
  if (!payload) return payload;
  if (typeof payload === 'string') payload = { content: payload };
  if (Array.isArray(payload)) payload = { components: payload };
  const original = payload;
  const out = { ...original };
  const embeds = (out.embeds || []).map(dataOf).filter(Boolean);
  const content = out.content;
  const normalized = (out.components || []).map(normalizeComponent).filter(Boolean);
  const hasReadyContainer = !content && !embeds.length && normalized.some(component => component.type === C.Container);
  if (hasReadyContainer) {
    delete out.content;
    delete out.embeds;
    delete out.poll;
    delete out.stickers;
    out.components = normalized.map((component, index) => withContainerColor(sanitizeComponent(component), index));
    out.flags = (out.flags || 0) | Flag;
    return out;
  }
  const { rows, others } = flattenActionRows(normalized);
  const blocks = [];
  if (content) blocks.push(td(content));
  if (embeds.length) {
    embeds.forEach((embed, index) => {
      if (index > 0 || blocks.length) blocks.push(sep());
      blocks.push(td(titleFromEmbed(embed)));
    });
  }
  const media = mediaFromEmbeds(embeds);
  if (media) {
    blocks.push(sep());
    blocks.push(media);
  }
  for (const other of others) blocks.push(other);
  for (const file of fileComponents(out.files)) blocks.push(file);
  for (const actionRow of rows) blocks.push(actionRow);
  if (!blocks.length && (out.flags & Flag)) blocks.push(td('\u200b'));
  if (!blocks.length) return original;
  const containers = chunkComponents(blocks).map((components, index) => ({
    type: C.Container,
    accent_color: [0x5865f2, 0x57f287, 0xfee75c, 0xeb459e, 0x2b2d31][index % 5],
    components: components.map(sanitizeComponent)
  }));
  delete out.content;
  delete out.embeds;
  delete out.poll;
  delete out.stickers;
  out.components = containers;
  out.flags = (out.flags || 0) | Flag;
  return out;
}

function patchMethod(proto, name) {
  const current = proto?.[name];
  if (!current || current.__componentsV2Patched) return;
  const patched = function patchedComponentsV2(payload, ...rest) {
    return current.call(this, toV2Payload(payload), ...rest);
  };
  patched.__componentsV2Patched = true;
  proto[name] = patched;
}

function patchDiscord() {
  const djs = require('discord.js');
  const targets = [
    djs.TextBasedChannel?.prototype,
    djs.BaseGuildTextChannel?.prototype,
    djs.GuildTextThreadManager?.prototype,
    djs.ThreadChannel?.prototype,
    djs.Message?.prototype,
    djs.CommandInteraction?.prototype,
    djs.ChatInputCommandInteraction?.prototype,
    djs.ButtonInteraction?.prototype,
    djs.StringSelectMenuInteraction?.prototype,
    djs.UserSelectMenuInteraction?.prototype,
    djs.RoleSelectMenuInteraction?.prototype,
    djs.MentionableSelectMenuInteraction?.prototype,
    djs.ChannelSelectMenuInteraction?.prototype,
    djs.ModalSubmitInteraction?.prototype,
    BaseInteraction?.prototype
  ].filter(Boolean);
  for (const proto of targets) {
    patchMethod(proto, 'send');
    patchMethod(proto, 'reply');
    patchMethod(proto, 'editReply');
    patchMethod(proto, 'followUp');
    patchMethod(proto, 'update');
    patchMethod(proto, 'edit');
  }
}

function createTextModal(customId, title, fields) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title.slice(0, 45));
  for (const field of fields.slice(0, 5)) {
    const input = new TextInputBuilder()
      .setCustomId(field.customId)
      .setLabel(field.label.slice(0, 45))
      .setStyle(field.style)
      .setRequired(field.required !== false);
    if (field.placeholder) input.setPlaceholder(field.placeholder.slice(0, 100));
    if (field.minLength !== undefined) input.setMinLength(field.minLength);
    if (field.maxLength !== undefined) input.setMaxLength(field.maxLength);
    if (field.value !== undefined) input.setValue(String(field.value).slice(0, field.maxLength || 4000));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
  return modal;
}

function createRawFileUploadModal(customId, title, label, uploadCustomId, options = {}) {
  return {
    custom_id: customId,
    title: title.slice(0, 45),
    components: [{
      type: C.Label,
      label: label.slice(0, 45),
      description: options.description ? String(options.description).slice(0, 100) : undefined,
      component: {
        type: C.FileUpload,
        custom_id: uploadCustomId,
        min_values: options.minValues ?? (options.required === false ? 0 : 1),
        max_values: options.maxValues ?? 1,
        required: options.required !== false
      }
    }]
  };
}

module.exports = { C, Flag, toV2Payload, patchDiscord, td, sep, row, createTextModal, createRawFileUploadModal };