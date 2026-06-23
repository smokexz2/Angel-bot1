const {
  JsonDatabase,
} = require("./jsondb");
const fs = require('fs');
const path = require('path');


const emojisPath = path.join(__dirname, 'emojis.json');
let emojisCache = null;
let lastEmojisLoad = 0;
const EMOJI_CACHE_TTL = 60000; 

const getEmojis = () => {
  const now = Date.now();
  
  if (!emojisCache || (now - lastEmojisLoad) > EMOJI_CACHE_TTL) {
    try {
      const resolvedPath = require.resolve('./emojis.json');
      const freshData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      if (require.cache[resolvedPath]) {
        const cached = require.cache[resolvedPath].exports;
        Object.keys(cached).forEach(k => delete cached[k]);
        Object.assign(cached, freshData);
        emojisCache = cached;
      } else {
        emojisCache = freshData;
        require.cache[resolvedPath] = { id: resolvedPath, filename: resolvedPath, loaded: true, exports: emojisCache, children: [], paths: [] };
      }
      lastEmojisLoad = now;
    } catch {
      emojisCache = {};
    }
  }
  return emojisCache;
};


const EmojisHelper = {
  get: (name) => {
    const emojis = getEmojis();
    return emojis[name] || "";
  },
  getAll: () => getEmojis(),
  reload: () => {
    emojisCache = null;
    lastEmojisLoad = 0;
    return getEmojis();
  }
};

const produtos = new JsonDatabase({
  databasePath: "./database/produtos.json"
});

const buttons = new JsonDatabase({
  databasePath: "./database/buttons.json"
});

const carrinhos = new JsonDatabase({
  databasePath: "./database/carrinhos.json"
});

const pagamentos = new JsonDatabase({
  databasePath: "./database/pagamentos.json"
});

const pedidos = new JsonDatabase({
  databasePath: "./database/pedidos.json"
});

const estatisticas = new JsonDatabase({
  databasePath: "./database/estatisticas.json"
});

const configuracao = new JsonDatabase({
  databasePath: "./database/configuracao.json"
});

const tickets = new JsonDatabase({
  databasePath: "./database/tickets.json"
});

const perms = new JsonDatabase({
  databasePath: "./database/perms.json"
});

const msgsauto = new JsonDatabase({
  databasePath: "./database/msgsauto.json"
});

const entregaslog = new JsonDatabase({
  databasePath: "./database/entregaslog.json"
});
const SystemMod = new JsonDatabase({
  databasePath: "./database/SystemMod.json"
});
const Temporario = new JsonDatabase({
  databasePath: "./database/Temporario.json"
});
const Convites = new JsonDatabase({
  databasePath: "./database/Convites.json"
});
const GuildsInvites = new JsonDatabase({
  databasePath: "./database/GuildsInvites.json"
});
const Emojis = new JsonDatabase({
  databasePath: "./database/emojis.json"
});
const refounds = new JsonDatabase({
  databasePath: "./database/refounds.json"
});
const Compras = new JsonDatabase({
  databasePath: "./database/Compras.json"
});
const BackupStorage = new JsonDatabase({
  databasePath: "./database/BackupStorage.json"
});

const autolock = new JsonDatabase({
  databasePath: "./database/autolock.json"
});

const configuracaorobux = new JsonDatabase({
  databasePath: "./database/configuracaorobux.json"
});

const mensagemrobux = new JsonDatabase({
  databasePath: "./database/mensagemrobux.json"
});

const carrinhosrobux = new JsonDatabase({
  databasePath: "./database/carrinhosrobux.json"
});

const sorteios = new JsonDatabase({
  databasePath: "./database/sorteios.json"
});

const sugestao = new JsonDatabase({
  databasePath: "./database/sugestao.json"
});

const transcript = new JsonDatabase({
  databasePath: "./database/transcript.json"
});

const giftcards = new JsonDatabase({
  databasePath: "./database/giftcards.json"
});

const gamepassJogos = new JsonDatabase({
  databasePath: "./database/gamepassJogos.json"
});

const stockAutoConfig = new JsonDatabase({
  databasePath: "./database/stockAutoConfig.json"
});

const iaConfig = new JsonDatabase({
  databasePath: "./database/iaConfig.json"
});

module.exports = {
  produtos,
  buttons,
  carrinhos,
  pagamentos,
  pedidos,
  configuracao,
  estatisticas,
  GuildsInvites,
  tickets,
  perms,
  msgsauto,
  entregaslog,
  SystemMod,
  Temporario,
  Convites,
  Emojis,
  EmojisHelper,
  refounds,
  Compras,
  BackupStorage,
  autolock,
  configuracaorobux,
  mensagemrobux,
  carrinhosrobux,
  sorteios,
  sugestao,
  transcript,
  giftcards,
  gamepassJogos,
  stockAutoConfig,
  iaConfig
}