const { createContainer, isAttachment, withProperties } = require("@magicyan/discord");
const { MessageFlags } = require("discord.js");

const constants = {
    colors: {
        main: "#7c3aed",
        green: "#22c55e",
        red: "#ef4444"
    }
};

function normalizeFlags(flags) {
    const list = Array.isArray(flags) ? flags : flags !== undefined ? [flags] : [];
    return list.reduce((acc, flag) => acc | Number(flag), MessageFlags.IsComponentsV2);
}

const res = Object.entries(constants.colors)
    .reduce((acc, [key, color]) => ({
        ...acc,
        [key]: function(...components) {
            const cleanComponents = components.filter(c => c !== undefined && c !== null && !isAttachment(c));
            const container = createContainer(color, cleanComponents);
            const files = components.filter(isAttachment);
            const defaults = {
                files,
                flags: MessageFlags.IsComponentsV2,
                components: [container]
            };
            const withFunc = (options = {}) => {
                const newOptions = { ...options };
                const extraComponents = Array.isArray(newOptions.components) ? newOptions.components : [];
                const extraFiles = Array.isArray(newOptions.files) ? newOptions.files : [];
                delete newOptions.components;
                delete newOptions.content;
                delete newOptions.embeds;
                const mergedContainer = extraComponents.length
                    ? createContainer(color, [
                        ...cleanComponents,
                        ...extraComponents.map(c => typeof c.toJSON === "function" ? c.toJSON() : c)
                    ])
                    : container;
                return {
                    ...defaults,
                    ...newOptions,
                    files: [...files, ...extraFiles],
                    flags: normalizeFlags(newOptions.flags),
                    components: [mergedContainer]
                };
            };
            return withProperties(defaults, { with: withFunc });
        }
    }), {});

function container(color, ...components) {
    const containerObj = createContainer(color || "#2f3136", components.filter(c => c !== undefined && c !== null && !isAttachment(c)));
    const files = components.filter(isAttachment);
    return {
        files,
        flags: MessageFlags.IsComponentsV2,
        components: [containerObj]
    };
}

function containerEphemeral(color, ...components) {
    const containerObj = createContainer(color || "#2f3136", components.filter(c => c !== undefined && c !== null && !isAttachment(c)));
    const files = components.filter(isAttachment);
    return {
        files,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [containerObj]
    };
}

module.exports = { res, container, containerEphemeral };