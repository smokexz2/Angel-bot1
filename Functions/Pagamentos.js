const { FormasDePagamentos } = require('./FormasDePagamentosConfig');

async function formasPagamento(interaction) {
    return FormasDePagamentos(interaction);
}

module.exports = { formasPagamento };