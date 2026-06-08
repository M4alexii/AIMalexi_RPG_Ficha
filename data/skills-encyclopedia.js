/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · data/skills-encyclopedia.js
   ETAPA 9 (#30) — Base de conhecimento das perícias do Chamado de Cthulhu 7e.

   Cada entrada (por nome de perícia):
     descricao    — função resumida da perícia
     podeFazer[]  — usos práticos permitidos
     naoPodeFazer[] — limitações
     exemplos[]   — exemplos narrativos
     interacoes[] — perícias relacionadas
     acoes[]      — (opcional) ações contextuais rápidas { label, difficulty? }

   Cobre as perícias mais usadas; as demais caem no fallback da UI (usa note/
   examples da definição base). Conteúdo resumido para consulta rápida em mesa.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoCData = window.CoCData || {};

window.CoCData.skillsEncyclopedia = {
  "Antropologia": {
    descricao: "Estudo de culturas, costumes e sociedades humanas vivas.",
    podeFazer: ["Prever o comportamento de um grupo cultural", "Reconhecer ritos e tabus", "Integrar-se a uma comunidade após convívio"],
    naoPodeFazer: ["Datar artefatos antigos (use Arqueologia)", "Compreender cultos do Mythos por si só"],
    exemplos: ["Você entende o significado da máscara cerimonial e evita ofender os anciãos da aldeia."],
    interacoes: ["Arqueologia", "História", "Psicologia"]
  },
  "Arqueologia": {
    descricao: "Estudo de civilizações antigas a partir de seus vestígios materiais.",
    podeFazer: ["Datar e identificar artefatos e ruínas", "Reconhecer falsificações", "Planejar uma escavação"],
    naoPodeFazer: ["Ler línguas vivas (use Outra Língua)", "Decifrar tomos do Mythos sem Ocultismo/Mythos"],
    exemplos: ["Você percebe que a inscrição é milênios mais antiga do que a estrutura que a cerca."],
    interacoes: ["História", "Antropologia", "Ocultismo"]
  },
  "Arremessar": {
    descricao: "Acertar um alvo com objetos lançados: facas, pedras, granadas, lanças.",
    podeFazer: ["Lançar um objeto contra um alvo", "Acender e jogar um coquetel molotov", "Arremessar para distrair ou derrubar"],
    naoPodeFazer: ["Disparar armas de fogo (use Armas de Fogo)", "Garantir alcance além do permitido pelo objeto"],
    exemplos: ["Você atira o castiçal na lâmpada e mergulha o corredor na escuridão."],
    interacoes: ["Lutar", "Esquivar"],
    acoes: [{ label: "Arremessar" }]
  },
  "Arte/Ofício": {
    descricao: "Habilidade prática em uma arte ou ofício específico (pintura, fotografia, marcenaria, culinária...).",
    podeFazer: ["Criar ou avaliar uma obra da especialidade", "Ganhar a vida com o ofício", "Notar a técnica de um trabalho alheio"],
    naoPodeFazer: ["Cobrir especialidades não escolhidas", "Substituir Consertos para máquinas complexas"],
    exemplos: ["Como fotógrafo, você nota que a imagem foi montada em duas exposições."],
    interacoes: ["Avaliação", "História"]
  },
  "Avaliação": {
    descricao: "Estimar o valor, a autenticidade e a qualidade de bens e objetos.",
    podeFazer: ["Calcular o valor de uma peça", "Detectar falsificações e adulterações", "Reconhecer materiais e procedência"],
    naoPodeFazer: ["Garantir a história oculta de um item", "Datar com precisão arqueológica (use Arqueologia)"],
    exemplos: ["Você percebe que o 'anel de ouro' é apenas folheado e vale pouco."],
    interacoes: ["Arte/Ofício", "História", "Contabilidade"]
  },
  "Cavalgar": {
    descricao: "Montar e controlar cavalos e outras montarias.",
    podeFazer: ["Cavalgar em terreno difícil", "Permanecer na sela em situação de estresse", "Conduzir uma montaria em fuga ou perseguição"],
    naoPodeFazer: ["Domar um animal selvagem (use Treinar Animais)", "Controlar montaria em pânico extremo sem teste"],
    exemplos: ["Você se mantém firme quando o cavalo se assusta com o uivo na mata."],
    interacoes: ["Treinar Animais", "Saltar"]
  },
  "Chaveiro": {
    descricao: "Abrir fechaduras, cofres e mecanismos de travamento sem a chave.",
    podeFazer: ["Arrombar uma fechadura com gazuas", "Contornar trancas e cadeados", "Avaliar a dificuldade de um cofre"],
    naoPodeFazer: ["Abrir fechaduras eletrônicas modernas (use Eletrônica)", "Trabalhar rápido sem ferramentas adequadas"],
    exemplos: ["Após um minuto tenso, o trinco cede e a porta dos fundos se abre."],
    interacoes: ["Consertos Mecânicos", "Furtividade"],
    acoes: [{ label: "Arrombar Fechadura" }]
  },
  "Ciência": {
    descricao: "Conhecimento metódico em um campo científico específico (Biologia, Química, Física, Forense...).",
    podeFazer: ["Analisar amostras e fenômenos da especialidade", "Formular hipóteses e experimentos", "Interpretar resultados técnicos"],
    naoPodeFazer: ["Cobrir ciências fora da especialidade", "Explicar o que viola as leis naturais (Mythos)"],
    exemplos: ["Como química, você identifica o veneno pelos cristais no fundo da taça."],
    interacoes: ["Medicina", "Mundo Natural", "Usar Bibliotecas"]
  },
  "Consertos Elétricos": {
    descricao: "Reparar e adaptar sistemas elétricos: fiação, motores, geradores, iluminação.",
    podeFazer: ["Consertar ou sabotar instalações elétricas", "Religar a energia de um prédio", "Improvisar uma ligação"],
    naoPodeFazer: ["Reparar eletrônica fina (use Eletrônica)", "Trabalhar com segurança sem ferramentas"],
    exemplos: ["Você reativa o gerador e as luzes do porão piscam de volta à vida."],
    interacoes: ["Consertos Mecânicos", "Eletrônica"]
  },
  "Consertos Mecânicos": {
    descricao: "Reparar, montar e adaptar dispositivos e máquinas mecânicas.",
    podeFazer: ["Consertar motores e engrenagens", "Forçar portas e mecanismos", "Improvisar peças e ferramentas"],
    naoPodeFazer: ["Reparar circuitos eletrônicos (use Eletrônica)", "Operar veículos pesados (use Operar Maquinário Pesado)"],
    exemplos: ["Você remonta o carburador e o carro finalmente pega na terceira tentativa."],
    interacoes: ["Consertos Elétricos", "Chaveiro", "Operar Maquinário Pesado"]
  },
  "Contabilidade": {
    descricao: "Examinar registros financeiros e detectar padrões no dinheiro.",
    podeFazer: ["Auditar livros e balanços", "Detectar fraudes e desvios", "Inferir a saúde financeira de alguém"],
    naoPodeFazer: ["Avaliar objetos físicos (use Avaliação)", "Garantir intenções por trás dos números"],
    exemplos: ["Os livros não fecham: alguém vem desviando fundos para uma conta sombra."],
    interacoes: ["Direito", "Avaliação"]
  },
  "Demolições": {
    descricao: "Preparar, posicionar e detonar explosivos com segurança e eficácia.",
    podeFazer: ["Calcular cargas para uma estrutura", "Desarmar explosivos com cuidado", "Abrir caminho com uma detonação"],
    naoPodeFazer: ["Improvisar sem material adequado sem risco", "Garantir precisão sem tempo de preparo"],
    exemplos: ["A carga derruba exatamente o pilar certo, sem trazer o teto inteiro abaixo."],
    interacoes: ["Consertos Mecânicos", "Ciência"],
    acoes: [{ label: "Detonar / Desarmar", difficulty: "hard" }]
  },
  "Direito": {
    descricao: "Conhecimento das leis, procedimentos legais e do sistema judiciário.",
    podeFazer: ["Saber os próprios direitos e os limites da lei", "Preparar ou interpretar documentos legais", "Navegar a burocracia oficial"],
    naoPodeFazer: ["Garantir um veredito", "Substituir Persuasão diante de um júri"],
    exemplos: ["Você exige um mandado e o detetive recua, sem base legal para a busca."],
    interacoes: ["Persuasão", "Contabilidade", "Usar Bibliotecas"]
  },
  "Dirigir Automóveis": {
    descricao: "Conduzir veículos automotores comuns, inclusive sob pressão.",
    podeFazer: ["Pilotar em perseguições e fugas", "Manobrar em terreno ruim", "Evitar colisões súbitas"],
    naoPodeFazer: ["Operar aeronaves (use Pilotar) ou maquinário pesado", "Consertar o veículo (use Consertos Mecânicos)"],
    exemplos: ["Você derrapa na esquina molhada, mas mantém o carro na pista e ganha distância."],
    interacoes: ["Consertos Mecânicos", "Esquivar"],
    acoes: [{ label: "Manobra Arriscada", difficulty: "hard" }]
  },
  "Eletrônica": {
    descricao: "Reparar, montar e contornar dispositivos eletrônicos (rádios, alarmes, circuitos).",
    podeFazer: ["Consertar ou montar aparelhos eletrônicos", "Burlar alarmes e travas eletrônicas", "Improvisar um dispositivo de escuta"],
    naoPodeFazer: ["Programar software (use Usar Computadores)", "Reparar mecânica pura (use Consertos)"],
    exemplos: ["Você desvia a fiação do alarme e a sirene permanece muda."],
    interacoes: ["Consertos Elétricos", "Usar Computadores"]
  },
  "Hipnose": {
    descricao: "Induzir transe para sugestão, relaxamento ou recuperação de memórias.",
    podeFazer: ["Acalmar ou focar um sujeito disposto", "Auxiliar a recuperar memórias bloqueadas", "Sugerir comportamentos simples"],
    naoPodeFazer: ["Controlar a mente contra a vontade firme do alvo", "Forçar verdades ou curar loucura"],
    exemplos: ["Sob transe, a testemunha descreve o símbolo que sua mente havia escondido."],
    interacoes: ["Psicanálise", "Psicologia"]
  },
  "Leitura Labial": {
    descricao: "Compreender o que alguém diz observando o movimento dos lábios.",
    podeFazer: ["Acompanhar uma conversa à distância", "Entender alguém em ambiente barulhento", "Espionar sem ser ouvido"],
    naoPodeFazer: ["Ler lábios fora de linha de visão", "Captar idioma que você não conhece"],
    exemplos: ["Do outro lado do salão, você lê 'meia-noite, no cais' nos lábios do suspeito."],
    interacoes: ["Encontrar", "Furtividade", "Outra Língua"]
  },
  "Língua Nativa": {
    descricao: "Domínio do próprio idioma — fala, leitura e escrita refinadas.",
    podeFazer: ["Compreender textos complexos", "Expressar-se com nuance e precisão", "Captar sotaques e regionalismos"],
    naoPodeFazer: ["Entender idiomas estrangeiros (use Outra Língua)", "Decifrar línguas mortas ou do Mythos"],
    exemplos: ["O bilhete parece banal, mas você nota a escolha incomum de palavras — um código."],
    interacoes: ["Outra Língua", "Usar Bibliotecas"]
  },
  "Mergulho": {
    descricao: "Mergulhar com equipamento e operar com segurança debaixo d'água.",
    podeFazer: ["Mergulhar em profundidade com equipamento", "Trabalhar e buscar objetos submersos", "Gerenciar ar e descompressão"],
    naoPodeFazer: ["Nadar sem treino próprio (use Natação)", "Ignorar limites fisiológicos sem risco"],
    exemplos: ["Você desce ao casco afundado e recupera a caixa lacrada do camarote."],
    interacoes: ["Natação", "Sobrevivência"]
  },
  "Mundo Natural": {
    descricao: "Saber popular e prático sobre a natureza: plantas, animais, clima, terreno.",
    podeFazer: ["Identificar plantas e pegadas comuns", "Reconhecer comportamento animal", "Notar algo 'errado' na natureza"],
    naoPodeFazer: ["Análise científica rigorosa (use Ciência/Biologia)", "Explicar fenômenos do Mythos"],
    exemplos: ["Os animais sumiram da mata e até os insetos se calaram — algo os afugentou."],
    interacoes: ["Sobrevivência", "Rastrear", "Ciência"]
  },
  "Natação": {
    descricao: "Manter-se e deslocar-se na água por conta própria.",
    podeFazer: ["Nadar em águas calmas ou agitadas", "Resgatar alguém da água", "Resistir a uma correnteza"],
    naoPodeFazer: ["Mergulho com equipamento (use Mergulho)", "Nadar indefinidamente sem cansaço"],
    exemplos: ["Você atravessa o rio gelado e alcança a margem oposta, exausto mas vivo."],
    interacoes: ["Mergulho", "Saltar", "Sobrevivência"]
  },
  "Navegação": {
    descricao: "Determinar posição e traçar rota por terra, mar ou ar.",
    podeFazer: ["Orientar-se com mapa, bússola ou astros", "Traçar e manter um curso", "Estimar posição sem instrumentos"],
    naoPodeFazer: ["Pilotar o veículo (use Dirigir/Pilotar)", "Garantir rota com instrumentos quebrados sem teste"],
    exemplos: ["Sem bússola, você usa as estrelas para reencontrar o caminho de volta ao acampamento."],
    interacoes: ["Sobrevivência", "Pilotar", "Mundo Natural"]
  },
  "Nível de Crédito": {
    descricao: "Reflete a sua posição financeira e o padrão de vida — não é uma perícia de teste comum.",
    podeFazer: ["Definir hospedagem, gastos e patrimônio", "Abrir portas sociais conforme o status", "Bancar despesas compatíveis com o nível"],
    naoPodeFazer: ["Ser 'rolada' como perícia normal", "Garantir respeito além do que o dinheiro compra"],
    exemplos: ["Seu Crédito alto permite hospedar-se no melhor hotel e ser tratado como cavalheiro."],
    interacoes: ["Charme", "Persuasão", "Contabilidade"]
  },
  "Operar Maquinário Pesado": {
    descricao: "Manejar máquinas grandes: tratores, guindastes, escavadeiras, locomotivas.",
    podeFazer: ["Operar equipamento industrial", "Mover ou erguer grandes cargas", "Trabalhar com a máquina sob pressão"],
    naoPodeFazer: ["Dirigir automóveis comuns (use Dirigir)", "Reparar a máquina (use Consertos)"],
    exemplos: ["Com o guindaste, você ergue a viga e libera a entrada bloqueada da mina."],
    interacoes: ["Consertos Mecânicos", "Dirigir Automóveis"]
  },
  "Outra Língua": {
    descricao: "Conhecimento de um idioma estrangeiro específico (escolhido por especialização).",
    podeFazer: ["Falar, ler e escrever no idioma conforme o nível", "Traduzir documentos", "Conversar com falantes nativos"],
    naoPodeFazer: ["Cobrir idiomas não escolhidos", "Ler línguas mortas/do Mythos sem perícia própria"],
    exemplos: ["Você traduz a carta em latim e descobre o nome verdadeiro do remetente."],
    interacoes: ["Língua Nativa", "Usar Bibliotecas", "Arqueologia"]
  },
  "Pilotar": {
    descricao: "Conduzir aeronaves ou embarcações de uma categoria específica.",
    podeFazer: ["Pilotar a aeronave/barco da especialidade", "Manobrar em condições adversas", "Pousar ou atracar em emergência"],
    naoPodeFazer: ["Pilotar categorias não treinadas", "Reparar o veículo (use Consertos)"],
    exemplos: ["Com o motor falhando, você plana o avião até um pouso forçado no campo."],
    interacoes: ["Navegação", "Consertos Mecânicos"],
    acoes: [{ label: "Manobra de Emergência", difficulty: "hard" }]
  },
  "Rastrear": {
    descricao: "Seguir trilhas e sinais deixados por pessoas, animais ou criaturas.",
    podeFazer: ["Seguir pegadas e rastros", "Estimar número, tempo e direção", "Notar quando uma trilha foi forjada"],
    naoPodeFazer: ["Rastrear sem nenhum vestígio", "Identificar criaturas do Mythos sem outro conhecimento"],
    exemplos: ["As marcas no barro levam até uma entrada escondida sob as raízes."],
    interacoes: ["Encontrar", "Mundo Natural", "Sobrevivência"]
  },
  "Saltar": {
    descricao: "Pular sobre obstáculos, vãos e alturas com controle.",
    podeFazer: ["Saltar fendas e obstáculos", "Amortecer uma queda controlada", "Alcançar uma beirada em fuga"],
    naoPodeFazer: ["Vencer distâncias impossíveis para o corpo", "Escalar superfícies (use Escalar)"],
    exemplos: ["Você salta entre os telhados e escapa por um triz dos perseguidores."],
    interacoes: ["Escalar", "Esquivar", "Natação"]
  },
  "Sobrevivência": {
    descricao: "Manter-se vivo em ambientes hostis (escolha por tipo: floresta, deserto, mar, ártico...).",
    podeFazer: ["Achar água, abrigo e comida", "Orientar-se e evitar perigos do terreno", "Resistir a exposição e fadiga"],
    naoPodeFazer: ["Cobrir ambientes fora da especialidade", "Curar ferimentos (use Primeiros Socorros)"],
    exemplos: ["Na mata, você arma um abrigo e mantém o grupo seco durante a tempestade."],
    interacoes: ["Mundo Natural", "Rastrear", "Navegação"]
  },
  "Treinar Animais": {
    descricao: "Domar, adestrar e comandar animais.",
    podeFazer: ["Ensinar comandos a um animal", "Acalmar ou conduzir um bicho nervoso", "Trabalhar com animais de carga ou guarda"],
    naoPodeFazer: ["Controlar criaturas do Mythos", "Garantir obediência sob terror extremo"],
    exemplos: ["Você acalma os cães de guarda com voz firme e passa sem alarde."],
    interacoes: ["Cavalgar", "Mundo Natural", "Psicologia"]
  },
  "Usar Computadores": {
    descricao: "Operar, programar e investigar sistemas computacionais (eras modernas).",
    podeFazer: ["Buscar e cruzar dados digitais", "Programar, invadir ou proteger sistemas", "Recuperar arquivos apagados"],
    naoPodeFazer: ["Reparar o hardware (use Eletrônica)", "Existir em campanhas de época sem tecnologia"],
    exemplos: ["Você recupera os e-mails apagados e encontra a ordem de compra suspeita."],
    interacoes: ["Eletrônica", "Usar Bibliotecas"]
  },
  "Armas de Fogo (Rifles/Espingardas)": {
    descricao: "Uso de armas de fogo longas: rifles e espingardas.",
    podeFazer: ["Disparar a média e longa distância (rifle)", "Acertar vários alvos próximos com espingarda", "Tiro mirado para mais precisão"],
    naoPodeFazer: ["Atingir além do alcance sem penalidade", "Esconder a arma com facilidade"],
    exemplos: ["Da janela, você alinha o rifle e atinge a criatura antes que ela alcance o grupo."],
    interacoes: ["Encontrar", "Esquivar"],
    acoes: [{ label: "Disparar" }, { label: "Tiro Mirado", difficulty: "hard" }]
  },
  "Armas de Fogo (Submetralhadoras)": {
    descricao: "Uso de submetralhadoras — armas automáticas leves de curto alcance.",
    podeFazer: ["Disparar rajadas curtas", "Cobrir uma área próxima", "Atirar em movimento"],
    naoPodeFazer: ["Manter precisão em rajadas longas", "Acertar alvos a longa distância"],
    exemplos: ["Uma rajada curta força os capangas a procurar abrigo atrás dos caixotes."],
    interacoes: ["Esquivar", "Armas de Fogo (Pistolas)"],
    acoes: [{ label: "Rajada" }]
  },
  "Armas de Fogo (Metralhadoras)": {
    descricao: "Uso de metralhadoras pesadas e de uso militar.",
    podeFazer: ["Fogo de supressão sobre uma área", "Atingir vários alvos em rajada", "Sustentar tiro montado"],
    naoPodeFazer: ["Manejar com mobilidade como arma leve", "Precisão fina em alvo único"],
    exemplos: ["O fogo sustentado mantém a horda presa do outro lado da ponte."],
    interacoes: ["Armas de Fogo (Submetralhadoras)", "Artilharia"],
    acoes: [{ label: "Fogo de Supressão" }]
  },
  "Artilharia": {
    descricao: "Operar armamentos de grande porte: canhões, morteiros e peças de artilharia.",
    podeFazer: ["Mirar e disparar peças pesadas", "Calcular trajetória e alcance", "Coordenar uma equipe de tiro"],
    naoPodeFazer: ["Manejar sozinho como arma portátil", "Ser útil sem o equipamento adequado"],
    exemplos: ["O disparo do morteiro cai exatamente sobre a entrada da caverna."],
    interacoes: ["Armas de Fogo (Metralhadoras)", "Demolições"],
    acoes: [{ label: "Disparar Peça", difficulty: "hard" }]
  },
  "Esquivar": {
    descricao: "Mover-se reflexivamente para fora do caminho de um ataque ou perigo iminente.",
    podeFazer: ["Evitar um ataque corpo a corpo", "Escapar de um perigo súbito (queda, desmoronamento)", "Reagir mesmo sem ação no round"],
    naoPodeFazer: ["Esquivar de armas de fogo (exceto se ciente do disparo)", "Atacar no mesmo movimento", "Ser usada proativamente para atacar"],
    exemplos: ["Você se joga para o lado quando o cultista avança com a faca."],
    interacoes: ["Lutar", "Saltar"],
    acoes: [{ label: "Realizar Esquiva" }]
  },
  "Lutar": {
    descricao: "Combate corpo a corpo: socos, golpes com armas brancas e improvisadas.",
    podeFazer: ["Atacar em combate próximo", "Contra-atacar quando atacado", "Executar manobras (derrubar, desarmar)"],
    naoPodeFazer: ["Atingir alvos fora de alcance", "Substituir Armas de Fogo"],
    exemplos: ["Você acerta um gancho no maxilar do capanga."],
    interacoes: ["Esquivar", "Armas de Fogo (Pistolas)"],
    acoes: [{ label: "Atacar" }, { label: "Contra-atacar" }, { label: "Manobra" }]
  },
  "Armas de Fogo (Pistolas)": {
    descricao: "Uso de armas de fogo curtas: pistolas e revólveres.",
    podeFazer: ["Disparar à distância", "Tiro mirado (sacrificando ação por bônus)", "Disparos múltiplos conforme a arma"],
    naoPodeFazer: ["Atingir além do alcance da arma sem penalidade", "Recarregar e atirar no mesmo round (geralmente)"],
    exemplos: ["Você saca o revólver e dispara contra a criatura."],
    interacoes: ["Esquivar", "Encontrar"],
    acoes: [{ label: "Disparar" }, { label: "Tiro Mirado", difficulty: "hard" }]
  },
  "Encontrar": {
    descricao: "Localizar objetos ocultos, pistas e detalhes do ambiente com busca ativa.",
    podeFazer: ["Achar passagens secretas", "Notar pistas físicas", "Revistar um cômodo"],
    naoPodeFazer: ["Perceber intenções (use Psicologia)", "Ouvir sons (use Escutar)"],
    exemplos: ["Você nota o assoalho solto que esconde o diário."],
    interacoes: ["Escutar", "Usar Bibliotecas", "Psicologia"]
  },
  "Escutar": {
    descricao: "Perceber e interpretar sons — conversas, passos, ruídos sutis.",
    podeFazer: ["Ouvir conversa atrás de uma porta", "Detectar alguém se aproximando", "Identificar um som suspeito"],
    naoPodeFazer: ["Ver no escuro", "Ler lábios (use Leitura Labial)"],
    exemplos: ["Você ouve sussurros em uma língua desconhecida no porão."],
    interacoes: ["Encontrar", "Furtividade"]
  },
  "Psicologia": {
    descricao: "Ler emoções, intenções e estado mental de outras pessoas.",
    podeFazer: ["Detectar mentiras", "Avaliar a sinceridade de um NPC", "Perceber medo, hostilidade ou instabilidade"],
    naoPodeFazer: ["Ler mentes", "Diagnosticar transtornos (use Psicanálise)", "Garantir certeza absoluta"],
    exemplos: ["Você percebe que o delegado esconde algo ao mencionar a vítima."],
    interacoes: ["Psicanálise", "Persuasão", "Intimidação"],
    acoes: [{ label: "Analisar Comportamento" }]
  },
  "Usar Bibliotecas": {
    descricao: "Encontrar a informação certa em arquivos, bibliotecas e registros.",
    podeFazer: ["Localizar referências e documentos", "Pesquisar histórico de um local/pessoa", "Encontrar artigos de jornal"],
    naoPodeFazer: ["Compreender textos do Mythos (use Mythos/Ocultismo)", "Obter o que não existe no acervo"],
    exemplos: ["Após horas, você encontra a escritura original da mansão."],
    interacoes: ["História", "Ocultismo", "Direito"]
  },
  "Charme": {
    descricao: "Influenciar pelo carisma, simpatia e atração pessoal.",
    podeFazer: ["Ganhar simpatia de um NPC", "Negociar de forma amistosa", "Causar boa primeira impressão"],
    naoPodeFazer: ["Forçar contra a vontade (use Intimidação)", "Enganar com mentiras (use Lábia)"],
    exemplos: ["Seu sorriso convence a recepcionista a abrir uma exceção."],
    interacoes: ["Persuasão", "Lábia", "Intimidação"],
    acoes: [{ label: "Encantar Alvo" }]
  },
  "Intimidação": {
    descricao: "Coagir por medo, ameaça ou demonstração de força.",
    podeFazer: ["Forçar cooperação por medo", "Arrancar informações sob pressão", "Afastar uma ameaça"],
    naoPodeFazer: ["Criar lealdade genuína", "Funcionar contra quem não teme consequências"],
    exemplos: ["Você encurrala o informante e ele entrega o endereço."],
    interacoes: ["Charme", "Persuasão", "Lutar"],
    acoes: [{ label: "Intimidar Alvo" }]
  },
  "Persuasão": {
    descricao: "Convencer pela lógica, argumentação e razão, ao longo do tempo.",
    podeFazer: ["Mudar a opinião de alguém com argumentos", "Negociar acordos", "Convencer de uma verdade"],
    naoPodeFazer: ["Efeito instantâneo em multidões", "Vencer alguém irredutível num só teste"],
    exemplos: ["Você argumenta até o curador permitir o acesso ao arquivo restrito."],
    interacoes: ["Charme", "Lábia", "Psicologia"],
    acoes: [{ label: "Convencer Alvo" }]
  },
  "Lábia": {
    descricao: "Enganar, blefar e despistar com lábia rápida e meias-verdades.",
    podeFazer: ["Mentir de forma convincente", "Criar distrações verbais", "Disfarçar intenções"],
    naoPodeFazer: ["Sustentar mentira facilmente verificável", "Convencer por mérito real (use Persuasão)"],
    exemplos: ["Você convence o guarda de que é o novo inspetor."],
    interacoes: ["Persuasão", "Disfarce", "Charme"]
  },
  "Primeiros Socorros": {
    descricao: "Cuidados imediatos para estabilizar ferimentos.",
    podeFazer: ["Recuperar 1 PV de um ferido", "Estabilizar quem está morrendo", "Estancar sangramento"],
    naoPodeFazer: ["Curar grandes quantidades de PV (use Medicina)", "Tratar doenças/venenos complexos", "Ser usada duas vezes no mesmo ferimento"],
    exemplos: ["Você improvisa um torniquete e estabiliza o companheiro caído."],
    interacoes: ["Medicina"],
    acoes: [{ label: "Aplicar Primeiros Socorros" }]
  },
  "Medicina": {
    descricao: "Conhecimento médico para diagnóstico e tratamento prolongado.",
    podeFazer: ["Tratar ferimentos ao longo de dias", "Diagnosticar doenças", "Reconhecer causa de morte"],
    naoPodeFazer: ["Curar instantaneamente em combate", "Operar sem instrumentos adequados (penalidade)"],
    exemplos: ["Sua avaliação revela que a vítima foi envenenada, não esfaqueada."],
    interacoes: ["Primeiros Socorros", "Ciência", "Psicanálise"],
    acoes: [{ label: "Tratar Ferimentos" }, { label: "Tratamento de Longo Prazo" }]
  },
  "Ocultismo": {
    descricao: "Reconhecer símbolos, crenças, tradições, lendas e práticas esotéricas.",
    podeFazer: ["Reconhecer símbolos arcanos", "Identificar cultos conhecidos", "Interpretar textos esotéricos", "Relacionar mitos e entidades"],
    naoPodeFazer: ["Conjurar magias", "Substituir Mythos de Cthulhu", "Identificar automaticamente entidades desconhecidas"],
    exemplos: ["Você reconhece o símbolo na parede como um selo de proteção medieval.", "Você sabe que este ritual pertence a uma seita antiga."],
    interacoes: ["Usar Bibliotecas", "História", "Antropologia", "Mythos de Cthulhu"]
  },
  "Psicanálise": {
    descricao: "Terapia para tratar traumas mentais e recuperar Sanidade.",
    podeFazer: ["Recuperar SAN de um paciente ao longo do tempo", "Ajudar a sair de loucura indefinida", "Acalmar surtos"],
    naoPodeFazer: ["Curar SAN instantaneamente", "Reverter perda permanente por Mythos"],
    exemplos: ["Sessões semanais ajudam o investigador a reconstruir sua psique."],
    interacoes: ["Psicologia", "Medicina"]
  },
  "Mythos de Cthulhu": {
    descricao: "Compreensão das verdades cósmicas — conhecimento que corrói a mente.",
    podeFazer: ["Reconhecer entidades e fenômenos do Mythos", "Compreender magias e tomos", "Prever comportamento de criaturas"],
    naoPodeFazer: ["Ser adquirida na criação de personagem", "Subir por estudo comum — só por exposição ao Mythos"],
    exemplos: ["Você reconhece o ser amorfo como um shoggoth e sabe o que ele faz."],
    interacoes: ["Ocultismo"],
    nota: "Cada ponto reduz a SAN máxima em 1 (SAN máx = 99 − Mythos)."
  },
  "Furtividade": {
    descricao: "Mover-se silenciosamente e permanecer despercebido.",
    podeFazer: ["Passar por guardas sem ser visto", "Aproximar-se sem ruído", "Esconder-se"],
    naoPodeFazer: ["Ficar invisível", "Funcionar em terreno barulhento sem penalidade"],
    exemplos: ["Você atravessa o salão de baile sem que ninguém note."],
    interacoes: ["Escutar", "Disfarce"]
  },
  "Disfarce": {
    descricao: "Alterar a aparência para se passar por outra pessoa ou tipo.",
    podeFazer: ["Fingir ser outra pessoa", "Misturar-se a um grupo", "Ocultar identidade"],
    naoPodeFazer: ["Enganar quem conhece bem o alvo de perto", "Mudar drasticamente de tamanho/voz sem apoio"],
    exemplos: ["Vestido de zelador, você entra na ala restrita sem suspeitas."],
    interacoes: ["Lábia", "Furtividade", "Arte/Ofício"]
  },
  "Escalar": {
    descricao: "Subir superfícies verticais usando força, técnica e equilíbrio.",
    podeFazer: ["Escalar paredes, rochas, fachadas", "Descer por cordas"],
    naoPodeFazer: ["Escalar superfícies impossíveis sem equipamento", "Ignorar quedas em falha grave"],
    exemplos: ["Você sobe pela parede de hera até a janela do segundo andar."],
    interacoes: ["Saltar", "Sobrevivência"]
  },
  "História": {
    descricao: "Conhecimento de eventos, períodos e contextos históricos.",
    podeFazer: ["Reconhecer artefatos e épocas", "Saber sobre eventos passados", "Contextualizar um local antigo"],
    naoPodeFazer: ["Saber detalhes ocultos do Mythos", "Prever o futuro"],
    exemplos: ["Você identifica o brasão como pertencente a uma família extinta no séc. XVIII."],
    interacoes: ["Usar Bibliotecas", "Arqueologia", "Ocultismo"]
  }
};

// Helper: lookup tolerante (tenta o nome, depois sem a especialização entre parênteses)
window.CoCData.findSkillEncyclopedia = function (name) {
  if (!name) return null;
  var enc = window.CoCData.skillsEncyclopedia;
  if (enc[name]) return enc[name];
  var base = name.replace(/\s*\(.+\)$/, "");
  return enc[base] || null;
};
