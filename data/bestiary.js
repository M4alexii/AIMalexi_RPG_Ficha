/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · data/bestiary.js
   Bestiário Operacional — Chamado de Cthulhu 7E
   ═══════════════════════════════════════════════════════════════════════════

   Filosofia:
   - Stats mecânicos apenas (não-protegíveis). Descrições são originais e curtas.
   - Derived (HP/MOV/DB) é MANUAL — duplicação barata > automação cara.
   - schemaVersion + id obrigatórios em cada entry.
   - Pronto para uso em <5s: Biblioteca → Selecionar → Jogar.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoCData = window.CoCData || {};

/**
 * Schema de cada criatura:
 * {
 *   schemaVersion: 1,
 *   id: string (kebab-case, único e estável),
 *   name: string,
 *   type: "human" | "mythos" | "animal",
 *   category: string (subcategoria leve, p/ filtro: "cultist", "deep-one", ...),
 *   stats: { str, con, siz, dex, int, pow, app?, edu? },
 *   derived: { hp, mov, db, build? },   // MANUAL
 *   armor: number,
 *   sanLoss: string ("0/1D6", "1/1D10", "—"),
 *   attacks: [{ name, type, chance, damage, note? }],
 *   skills?: [{ name, value }],   // perícias notáveis (opcional, só as relevantes em mesa)
 *   notes: [string, ...],
 *   tags: [string, ...]
 * }
 */

window.CoCData.bestiary = [

  // ═══════════════════════════════════════════════════════════════════════
  // HUMANOS — adversários comuns (cultistas, polícia, criminosos)
  // ═══════════════════════════════════════════════════════════════════════

  {
    schemaVersion: 1,
    id: "cultista-raso",
    name: "Cultista Raso",
    type: "human",
    category: "cultist",
    stats: { str: 55, con: 55, siz: 60, dex: 55, int: 55, pow: 50, app: 50, edu: 60 },
    derived: { hp: 11, mov: 8, db: "0", build: 0 },
    armor: 0,
    sanLoss: "—",
    attacks: [
      { name: "Faca de Cerimônia", type: "melee", chance: 40, damage: "1D4+2" },
      { name: "Soco", type: "melee", chance: 50, damage: "1D3" }
    ],
    skills: [
      { name: "Ocultismo", value: 40 },
      { name: "Furtividade", value: 35 },
      { name: "Lábia", value: 35 }
    ],
    notes: [
      "Hesita em combate aberto. Foge se em desvantagem.",
      "Conhece símbolos básicos e um nome proibido."
    ],
    tags: ["humano", "cultista", "antagonista-comum"]
  },

  {
    schemaVersion: 1,
    id: "cultista-fanatico",
    name: "Cultista Fanático",
    type: "human",
    category: "cultist",
    stats: { str: 65, con: 65, siz: 60, dex: 60, int: 60, pow: 75, app: 50, edu: 65 },
    derived: { hp: 12, mov: 8, db: "+1D4", build: 1 },
    armor: 0,
    sanLoss: "0/1D3",
    attacks: [
      { name: "Adaga Ritual", type: "melee", chance: 55, damage: "1D4+2+DB", note: "Empala em Sucesso Extremo" },
      { name: "Revólver .38", type: "firearm", chance: 40, damage: "1D10", note: "6 balas" }
    ],
    skills: [
      { name: "Ocultismo", value: 60 },
      { name: "Mythos de Cthulhu", value: 10 },
      { name: "Intimidação", value: 55 },
      { name: "Esquivar", value: 30 }
    ],
    notes: [
      "Não recua. Luta até morrer.",
      "Pode conhecer 1-2 feitiços menores (Encolher, Sopro do Profundo).",
      "Ver fanatismo + sigilos provoca leve perda de SAN."
    ],
    tags: ["humano", "cultista", "elite"]
  },

  {
    schemaVersion: 1,
    id: "policial",
    name: "Policial",
    type: "human",
    category: "law",
    stats: { str: 65, con: 65, siz: 65, dex: 55, int: 50, pow: 50, app: 50, edu: 50 },
    derived: { hp: 13, mov: 8, db: "+1D4", build: 1 },
    armor: 0,
    sanLoss: "—",
    attacks: [
      { name: "Revólver .38", type: "firearm", chance: 50, damage: "1D10", note: "6 balas; pode atirar 2x/rd" },
      { name: "Cassetete", type: "melee", chance: 55, damage: "1D6+DB" }
    ],
    skills: [
      { name: "Encontrar", value: 45 },
      { name: "Direito", value: 35 },
      { name: "Intimidação", value: 45 },
      { name: "Dirigir Automóveis", value: 50 }
    ],
    notes: [
      "Pode chamar reforço (rádio/apito).",
      "Hesita em situações sobrenaturais (teste de SAN do PRÓPRIO policial)."
    ],
    tags: ["humano", "lei", "neutro"]
  },

  {
    schemaVersion: 1,
    id: "detetive",
    name: "Detetive de Polícia",
    type: "human",
    category: "law",
    stats: { str: 60, con: 60, siz: 65, dex: 60, int: 70, pow: 60, app: 55, edu: 70 },
    derived: { hp: 12, mov: 8, db: "0", build: 0 },
    armor: 0,
    sanLoss: "—",
    attacks: [
      { name: "Revólver .38", type: "firearm", chance: 55, damage: "1D10" },
      { name: "Soco", type: "melee", chance: 45, damage: "1D3" }
    ],
    skills: [
      { name: "Psicologia", value: 60 },
      { name: "Encontrar", value: 60 },
      { name: "Persuasão", value: 50 },
      { name: "Direito", value: 50 },
      { name: "Furtividade", value: 55 }
    ],
    notes: [
      "Pode ser aliado ou rival dos investigadores.",
      "Tem acesso a arquivos e laboratório forense."
    ],
    tags: ["humano", "lei", "aliado-potencial"]
  },

  {
    schemaVersion: 1,
    id: "mafioso",
    name: "Mafioso / Capanga",
    type: "human",
    category: "criminal",
    stats: { str: 70, con: 70, siz: 70, dex: 60, int: 50, pow: 50, app: 50, edu: 45 },
    derived: { hp: 14, mov: 8, db: "+1D4", build: 1 },
    armor: 0,
    sanLoss: "—",
    attacks: [
      { name: "Pistola Semiautomática", type: "firearm", chance: 55, damage: "1D10", note: "15 balas, 3 tiros/rd" },
      { name: "Soqueira", type: "melee", chance: 60, damage: "1D3+1+DB" }
    ],
    skills: [
      { name: "Intimidação", value: 60 },
      { name: "Furtividade", value: 45 },
      { name: "Dirigir Automóveis", value: 55 },
      { name: "Lábia", value: 40 }
    ],
    notes: [
      "Em grupos de 2-4. Foge se o líder cair.",
      "Conhece a 'cidade subterrânea': contrabandistas, médicos clandestinos."
    ],
    tags: ["humano", "criminoso", "combatente"]
  },

  {
    schemaVersion: 1,
    id: "veterano",
    name: "Veterano (Soldado/Mercenário)",
    type: "human",
    category: "combatant",
    stats: { str: 75, con: 75, siz: 70, dex: 70, int: 60, pow: 60, app: 50, edu: 55 },
    derived: { hp: 14, mov: 9, db: "+1D4", build: 1 },
    armor: 1,
    sanLoss: "—",
    attacks: [
      { name: "Rifle .30-06", type: "firearm", chance: 65, damage: "2D6+4", note: "Empala. 5 balas." },
      { name: "Faca de Combate", type: "melee", chance: 60, damage: "1D4+2+DB", note: "Empala" }
    ],
    skills: [
      { name: "Esquivar", value: 60 },
      { name: "Primeiros Socorros", value: 55 },
      { name: "Sobrevivência", value: 55 },
      { name: "Furtividade", value: 50 },
      { name: "Intimidação", value: 60 }
    ],
    notes: [
      "Não entra em pânico. Calmo sob fogo cruzado.",
      "Mas teste de SAN normal para Mitos — guerra não prepara para tentáculos."
    ],
    tags: ["humano", "combatente", "elite"]
  },

  {
    schemaVersion: 1,
    id: "civil",
    name: "Civil / Testemunha",
    type: "human",
    category: "civilian",
    stats: { str: 50, con: 50, siz: 55, dex: 50, int: 60, pow: 50, app: 55, edu: 65 },
    derived: { hp: 10, mov: 8, db: "0", build: 0 },
    armor: 0,
    sanLoss: "—",
    attacks: [
      { name: "Soco em pânico", type: "melee", chance: 25, damage: "1D3" }
    ],
    skills: [
      { name: "Psicologia", value: 30 },
      { name: "Persuasão", value: 30 }
    ],
    notes: [
      "Foge sempre. Perde 1D6 SAN ao testemunhar Mythos.",
      "Útil como NPC informante. Pode ser vítima da próxima cena."
    ],
    tags: ["humano", "civil", "fragil"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MYTHOS — entidades do Cosmic Horror
  // ═══════════════════════════════════════════════════════════════════════

  {
    schemaVersion: 1,
    id: "profundo",
    name: "Profundo (Deep One)",
    type: "mythos",
    category: "deep-one",
    stats: { str: 75, con: 75, siz: 70, dex: 65, int: 65, pow: 65 },
    derived: { hp: 14, mov: 8, db: "+1D4", build: 1 },
    armor: 1,
    sanLoss: "0/1D6",
    attacks: [
      { name: "Garras", type: "melee", chance: 50, damage: "1D6+DB" },
      { name: "Tridente", type: "melee", chance: 55, damage: "1D8+1+DB", note: "Empala" }
    ],
    skills: [
      { name: "Lutar (Garras)", value: 50 },
      { name: "Natação", value: 90 },
      { name: "Furtividade", value: 40 }
    ],
    notes: [
      "Imortal — só morre por violência. Vem da fronteira marítima.",
      "Em terra firme há ~2-3 rodadas antes de buscar água.",
      "MOV 10 na água."
    ],
    tags: ["mythos", "aquatico", "combatente"]
  },

  {
    schemaVersion: 1,
    id: "carnical",
    name: "Carniçal (Ghoul)",
    type: "mythos",
    category: "ghoul",
    stats: { str: 65, con: 65, siz: 65, dex: 65, int: 65, pow: 50 },
    derived: { hp: 13, mov: 9, db: "+1D4", build: 1 },
    armor: 0,
    sanLoss: "1/1D6",
    attacks: [
      { name: "Garras (×2)", type: "melee", chance: 30, damage: "1D6+DB", note: "Pode atacar 2x por rodada — uma com cada mão" },
      { name: "Mordida", type: "melee", chance: 30, damage: "1D6+sangramento", note: "Se acerta, agarra; vítima deve resistir CON×5 ou perder 1D2 PV/rd até soltar" }
    ],
    skills: [
      { name: "Escalar", value: 65 },
      { name: "Furtividade", value: 55 },
      { name: "Esquivar", value: 50 }
    ],
    notes: [
      "Vive em catacumbas, esgotos, cemitérios.",
      "Caça em bando de 3-6. Animal-like — não negocia.",
      "Pode comunicar-se em uma língua gutural."
    ],
    tags: ["mythos", "subterraneo", "bando"]
  },

  {
    schemaVersion: 1,
    id: "cao-de-tindalos",
    name: "Cão de Tindalos",
    type: "mythos",
    category: "tindalos",
    stats: { str: 70, con: 70, siz: 60, dex: 90, int: 90, pow: 90 },
    derived: { hp: 13, mov: 12, db: "+1D4", build: 1 },
    armor: 0,
    sanLoss: "1/1D10",
    attacks: [
      { name: "Garras Angulares", type: "melee", chance: 50, damage: "1D6+1D6", note: "Drena vitalidade — perde também 1 POD/rd em contato" },
      { name: "Língua Sugadora", type: "melee", chance: 30, damage: "Drena 1D6 PV E 1D2 POD", note: "Após agarrar" }
    ],
    skills: [],
    notes: [
      "Caça através de ÂNGULOS. Cantos retos em paredes, móveis, sombras = portal.",
      "Sala perfeitamente CURVA (ou refúgio com pó d'Ibn-Ghazi) impede-o.",
      "Atravessa o tempo. Se você o viu uma vez, ele te encontra eternamente."
    ],
    tags: ["mythos", "perseguidor", "extra-dimensional"]
  },

  {
    schemaVersion: 1,
    id: "shoggoth-pequeno",
    name: "Shoggoth (Pequeno)",
    type: "mythos",
    category: "shoggoth",
    stats: { str: 200, con: 90, siz: 200, dex: 35, int: 50, pow: 75 },
    derived: { hp: 29, mov: 8, db: "+5D6", build: 6 },
    armor: 0,
    sanLoss: "1D6/1D20",
    attacks: [
      { name: "Esmagar / Engolfar", type: "melee", chance: 35, damage: "+5D6 (DB)", note: "Dano de esmagamento — gigantesco" },
      { name: "Pseudópodes", type: "melee", chance: 60, damage: "2D6", note: "Vários ataques simultâneos em alvos próximos" }
    ],
    skills: [],
    notes: [
      "Massa amorfa de protoplasma com olhos e bocas surgindo aleatoriamente.",
      "Imune a armas convencionais — armas de fogo causam 1 PV apenas.",
      "Fogo, eletricidade e ácido funcionam normalmente.",
      "Regenera 2 PV/rd se ferido."
    ],
    tags: ["mythos", "massa", "boss"]
  },

  {
    schemaVersion: 1,
    id: "byakhee",
    name: "Bizara (Byakhee)",
    type: "mythos",
    category: "byakhee",
    stats: { str: 75, con: 65, siz: 75, dex: 65, int: 50, pow: 65 },
    derived: { hp: 14, mov: 5, db: "+1D4", build: 1 },
    armor: 2,
    sanLoss: "1/1D6",
    attacks: [
      { name: "Garras", type: "melee", chance: 40, damage: "1D6+DB" },
      { name: "Mordida Sugadora", type: "melee", chance: 40, damage: "1D6 + drena 1D6 PV/rd", note: "Após agarrar com sucesso" }
    ],
    skills: [
      { name: "Furtividade", value: 30 }
    ],
    notes: [
      "Voa — MOV 20 no ar. Pode carregar 1 humano em voo.",
      "Servidor de Hastur. Pode transportar entre estrelas se o invocador conhece o ritual.",
      "Armadura natural quitinosa."
    ],
    tags: ["mythos", "voador", "servo"]
  },

  {
    schemaVersion: 1,
    id: "mi-go",
    name: "Mi-Go",
    type: "mythos",
    category: "mi-go",
    stats: { str: 50, con: 65, siz: 55, dex: 80, int: 90, pow: 75 },
    derived: { hp: 12, mov: 7, db: "0", build: 0 },
    armor: 0,
    sanLoss: "0/1D8",
    attacks: [
      { name: "Garras-Pinça", type: "melee", chance: 35, damage: "1D6", note: "Em sucesso extremo, agarra alvo" },
      { name: "Arma de Eletricidade", type: "ranged", chance: 50, damage: "1D10", note: "Alcance 15m. Ignora armadura comum." }
    ],
    skills: [
      { name: "Esquivar", value: 40 },
      { name: "Ciência (Cirurgia Cerebral)", value: 90 }
    ],
    notes: [
      "Voa — MOV 11 no ar (em atmosfera estranha que poucos respiram).",
      "Cabeças-cilindro: pode extrair cérebros humanos para preservação em jarras.",
      "Falam em uma voz zumbinho. Diplomatas implacáveis."
    ],
    tags: ["mythos", "alienigena", "tecnologico"]
  },

  {
    schemaVersion: 1,
    id: "servidor-sem-forma",
    name: "Servidor Sem Forma",
    type: "mythos",
    category: "formless",
    stats: { str: 75, con: 65, siz: 70, dex: 65, int: 35, pow: 50 },
    derived: { hp: 13, mov: 8, db: "+1D4", build: 1 },
    armor: 0,
    sanLoss: "0/1D6",
    attacks: [
      { name: "Tentáculos", type: "melee", chance: 50, damage: "1D6+DB", note: "Pode atacar 2 alvos diferentes por rodada" }
    ],
    skills: [],
    notes: [
      "Massa de tentáculos negros. Sem rosto, sem voz.",
      "Convocado por feitiço — leal ao invocador por 1 dia.",
      "Pode passar por buracos pequenos (líquido)."
    ],
    tags: ["mythos", "tentaculo", "invocado"]
  },

  {
    schemaVersion: 1,
    id: "ratos-noturnos",
    name: "Ratos Noturnos (Enxame)",
    type: "mythos",
    category: "swarm",
    stats: { str: 30, con: 35, siz: 60, dex: 70, int: 30, pow: 30 },
    derived: { hp: 9, mov: 9, db: "0", build: 0 },
    armor: 0,
    sanLoss: "0/1",
    attacks: [
      { name: "Mordidas em Enxame", type: "melee", chance: 75, damage: "1D6", note: "Atinge todos os alvos em melee. Dano contínuo enquanto o enxame estiver no espaço." }
    ],
    skills: [],
    notes: [
      "Enxame de centenas de ratos pretos com olhos vermelhos.",
      "Não pode ser 'morto' por arma única — fogo, água, espaço pequeno desfaz.",
      "Servo de cultistas. Aparece em ruínas, cemitérios, ruas escuras."
    ],
    tags: ["mythos", "enxame", "ambiente"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MYTHOS CLÁSSICO — Pacote Padrão (descrições ORIGINAIS; stats = regra aberta)
  // Nada aqui reproduz texto/arte de obras protegidas; são fichas mecânicas +
  // resumos próprios de criaturas consagradas (em sua maioria de domínio público).
  // ═══════════════════════════════════════════════════════════════════════

  {
    schemaVersion: 1,
    id: "magro-noturno",
    name: "Magro Noturno (Nightgaunt)",
    type: "mythos",
    category: "nightgaunt",
    stats: { str: 65, con: 65, siz: 65, dex: 70, int: 50, pow: 65 },
    derived: { hp: 13, mov: 8, db: "1D4", build: 1 },
    armor: 0,
    sanLoss: "0/1D6",
    attacks: [
      { name: "Garras", type: "melee", chance: 40, damage: "1D6+DB" },
      { name: "Agarrar e Erguer", type: "melee", chance: 40, damage: "agarra", note: "Em sucesso, ergue a vítima no ar e a subjuga com a cauda farpada." }
    ],
    skills: [ { name: "Voar", value: 60 }, { name: "Furtividade", value: 50 } ],
    notes: [
      "Humanoide negro e liso, sem rosto, com asas membranosas e cauda farpada (voo 12).",
      "Silencioso; não mata por escolha — captura e carrega para longe.",
      "Servo de entidades maiores; recua diante de sinais e símbolos antigos."
    ],
    tags: ["mythos", "voador", "servo"]
  },

  {
    schemaVersion: 1,
    id: "errante-dimensional",
    name: "Errante Dimensional",
    type: "mythos",
    category: "shambler",
    stats: { str: 75, con: 60, siz: 75, dex: 60, int: 50, pow: 65 },
    derived: { hp: 13, mov: 7, db: "1D6", build: 2 },
    armor: 3,
    sanLoss: "0/1D10",
    attacks: [
      { name: "Garras", type: "melee", chance: 45, damage: "1D6+DB" },
      { name: "Arrastar entre Dimensões", type: "melee", chance: 25, damage: "especial", note: "Agarra e tenta levar a vítima para outra dimensão (resistência POD×POD)." }
    ],
    skills: [ { name: "Caminhar entre Mundos", value: 75 } ],
    notes: [
      "Bípede simiesco e angular que aparece e some 'dobrando' o espaço.",
      "Surge de cantos e sombras; ignora paredes ao transitar entre realidades.",
      "Caçador a serviço de feiticeiros e de inteligências do Mythos."
    ],
    tags: ["mythos", "caçador", "translação"]
  },

  {
    schemaVersion: 1,
    id: "vampiro-estelar",
    name: "Vampiro Estelar",
    type: "mythos",
    category: "star-vampire",
    stats: { str: 90, con: 75, siz: 90, dex: 65, int: 50, pow: 70 },
    derived: { hp: 16, mov: 8, db: "1D6", build: 2 },
    armor: 0,
    sanLoss: "1/1D10",
    attacks: [
      { name: "Tentáculos", type: "melee", chance: 50, damage: "1D6+DB", note: "Agarra; em rodadas seguintes drena sangue automaticamente." },
      { name: "Drenar Sangue", type: "melee", chance: 0, damage: "1D6 PV/rodada", note: "Após agarrar — fica visível e avermelhado ao se fartar." }
    ],
    skills: [ { name: "Furtividade", value: 70 } ],
    notes: [
      "Invisível até se alimentar; revela-se como massa de tentáculos e ventosas.",
      "Risada borbulhante anuncia sua presença antes do bote.",
      "Convocado por rituais; voa e foge se saciado ou ferido demais."
    ],
    tags: ["mythos", "invisível", "convocado"]
  },

  {
    schemaVersion: 1,
    id: "jovem-sombrio",
    name: "Jovem Sombrio de Shub-Niggurath",
    type: "mythos",
    category: "dark-young",
    stats: { str: 145, con: 125, siz: 150, dex: 50, int: 50, pow: 70 },
    derived: { hp: 27, mov: 8, db: "4D6", build: 5 },
    armor: 0,
    sanLoss: "1D3/1D10",
    attacks: [
      { name: "Tentáculos (×2)", type: "melee", chance: 50, damage: "1D6 + drena 2D6 PV", note: "Agarra e suga; pode prender vários alvos." },
      { name: "Pisotear", type: "melee", chance: 35, damage: "DB", note: "Contra alvos derrubados." }
    ],
    skills: [],
    notes: [
      "Massa arbórea e escura, coberta de bocas, com patas em casco e tentáculos.",
      "Cheiro de cova aberta; deixa o solo apodrecido por onde passa.",
      "Adorada como 'a prole'; surge em clareiras de culto e pedras erguidas."
    ],
    tags: ["mythos", "colosso", "culto"]
  },

  {
    schemaVersion: 1,
    id: "coisa-ancia",
    name: "Coisa Anciã (Antigo)",
    type: "mythos",
    category: "elder-thing",
    stats: { str: 65, con: 80, siz: 75, dex: 50, int: 90, pow: 65, edu: 90 },
    derived: { hp: 15, mov: 8, db: "1D4", build: 1 },
    armor: 3,
    sanLoss: "0/1D6",
    attacks: [
      { name: "Tentáculos (×5)", type: "melee", chance: 35, damage: "1D6 + agarra", note: "Múltiplos apêndices; segura e imobiliza." }
    ],
    skills: [ { name: "Ciência (várias)", value: 90 }, { name: "Mythos de Cthulhu", value: 30 } ],
    notes: [
      "Barril vegetal com asas membranosas, cinco olhos e estrela na 'cabeça'.",
      "Cientista alienígena de civilização pré-humana; raciona, negocia, vivisseca.",
      "Resistente a frio e pressão; volta à vida após eras de hibernação."
    ],
    tags: ["mythos", "inteligente", "antigo"]
  },

  {
    schemaVersion: 1,
    id: "polipo-voador",
    name: "Pólipo Voador",
    type: "mythos",
    category: "flying-polyp",
    stats: { str: 105, con: 95, siz: 120, dex: 60, int: 75, pow: 80 },
    derived: { hp: 21, mov: 10, db: "2D6", build: 3 },
    armor: 0,
    sanLoss: "1/1D10",
    attacks: [
      { name: "Vento Cortante", type: "ranged", chance: 50, damage: "2D6", note: "Rajada de ar que suga e dilacera; alcança vários metros." },
      { name: "Esmagar", type: "melee", chance: 40, damage: "DB" }
    ],
    skills: [ { name: "Furtividade", value: 80 } ],
    notes: [
      "Forma parcialmente visível, half-poliposa, que controla o vento.",
      "Vulnerável a ataques elétricos; teme luz forte e ambientes fechados.",
      "Aprisionado em criptas seladas por civilizações antigas."
    ],
    tags: ["mythos", "vento", "selado"]
  },

  {
    schemaVersion: 1,
    id: "horror-cacador",
    name: "Horror Caçador",
    type: "mythos",
    category: "hunting-horror",
    stats: { str: 95, con: 80, siz: 110, dex: 75, int: 60, pow: 75 },
    derived: { hp: 19, mov: 10, db: "2D6", build: 3 },
    armor: 0,
    sanLoss: "1/1D8",
    attacks: [
      { name: "Mordida", type: "melee", chance: 50, damage: "1D8+DB" },
      { name: "Constringir", type: "melee", chance: 40, damage: "DB/rodada", note: "Enrola o corpo serpentino no alvo e aperta." }
    ],
    skills: [ { name: "Voar", value: 70 } ],
    notes: [
      "Serpente negra e alada, retorcida, que repele a luz ao redor.",
      "Enviado de Nyarlathotep para caçar um alvo específico até o fim.",
      "A luz do dia o destrói; só age na escuridão ou sob invocação."
    ],
    tags: ["mythos", "caçador", "voador"]
  },

  {
    schemaVersion: 1,
    id: "povo-serpente",
    name: "Povo Serpente",
    type: "mythos",
    category: "serpent-folk",
    stats: { str: 60, con: 65, siz: 65, dex: 70, int: 90, pow: 65, edu: 80 },
    derived: { hp: 13, mov: 9, db: "0", build: 0 },
    armor: 1,
    sanLoss: "0/1D6",
    attacks: [
      { name: "Mordida Venenosa", type: "melee", chance: 45, damage: "1D4 + veneno", note: "Veneno: POT 70; falha = 2D10 dano, sucesso = 1D10." },
      { name: "Cimitarra", type: "melee", chance: 40, damage: "1D8+DB" }
    ],
    skills: [ { name: "Ocultismo", value: 75 }, { name: "Mythos de Cthulhu", value: 25 }, { name: "Disfarce", value: 60 } ],
    notes: [
      "Humanoide reptiliano de civilização pré-humana; feiticeiros natos.",
      "Usa magia de ilusão para passar por humano e se infiltrar.",
      "Despreza a humanidade; busca reerguer seu império perdido."
    ],
    tags: ["mythos", "feiticeiro", "infiltrador"]
  },

  {
    schemaVersion: 1,
    id: "prole-estelar-cthulhu",
    name: "Prole Estelar de Cthulhu",
    type: "mythos",
    category: "star-spawn",
    stats: { str: 160, con: 140, siz: 170, dex: 50, int: 110, pow: 110 },
    derived: { hp: 31, mov: 10, db: "5D6", build: 6 },
    armor: 6,
    sanLoss: "1D6/1D20",
    attacks: [
      { name: "Tentáculos Faciais", type: "melee", chance: 50, damage: "1D6 + agarra", note: "Em agarrão, drena 1D6 PV/rodada." },
      { name: "Esmagar / Pisotear", type: "melee", chance: 40, damage: "DB" }
    ],
    skills: [ { name: "Mythos de Cthulhu", value: 50 } ],
    notes: [
      "Versão menor da forma de Cthulhu: cabeça de polvo, asas, corpo escamoso.",
      "Regenera ferimentos; recompõe-se mesmo após ser 'destruída'.",
      "Dorme em cidades afundadas, à espera do alinhamento certo."
    ],
    tags: ["mythos", "colosso", "regenera"]
  },

  {
    schemaVersion: 1,
    id: "cthulhu-avatar",
    name: "Cthulhu (avatar — escala de encontro)",
    type: "mythos",
    category: "great-old-one",
    stats: { str: 210, con: 200, siz: 290, dex: 50, int: 200, pow: 200 },
    derived: { hp: 49, mov: 12, db: "12D6", build: 11 },
    armor: 10,
    sanLoss: "1D10/1D100",
    attacks: [
      { name: "Tentáculo / Apêndice", type: "melee", chance: 75, damage: "1D6 + agarra; engolfa 1D3 alvos", note: "Engolfados perdem PV automaticamente por rodada." },
      { name: "Pisotear", type: "melee", chance: 50, damage: "DB" }
    ],
    skills: [ { name: "Mythos de Cthulhu", value: 100 } ],
    notes: [
      "Estatura de montanha; sua mera visão já fragmenta a mente (perda de SAN no encontro).",
      "Não pode ser 'morto' por meios mortais: dispersa-se e se reconstitui em rodadas.",
      "ESCALA SIMBÓLICA — ajuste à sua mesa. Ideal para confronto narrativo, não combate vencível.",
      "Atravessar/contê-lo exige feitiços, artefatos ou o adormecer das estrelas, não armas."
    ],
    tags: ["mythos", "grande-antigo", "narrativo", "invencível"]
  }

];

// Helper: lookup por id
window.CoCData.findBestiary = function (id) {
  if (!id) return null;
  return window.CoCData.bestiary.find(c => c.id === id) || null;
};

// Helper: agrupar por tipo
window.CoCData.bestiaryByType = function () {
  const groups = { human: [], mythos: [], animal: [] };
  for (const c of window.CoCData.bestiary) {
    (groups[c.type] = groups[c.type] || []).push(c);
  }
  return groups;
};

// Labels de tipo
window.CoCData.bestiaryTypeLabels = {
  human: "Humanos",
  mythos: "Mythos",
  animal: "Animais"
};
