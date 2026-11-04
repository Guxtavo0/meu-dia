/* ===== Conteúdo padrão (tudo editável no app) =====
   Dias: 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb
   Horários dos dias úteis vêm da sua descrição. Fim de semana é sugestão minha: ajuste em Rotina. */
const WK = [1,2,3,4,5], WE = [0,6], ALL = [0,1,2,3,4,5,6];
const CAT = {prot:'Carnes, peixes e ovos', lat:'Laticínios', gra:'Arroz, feijão e grãos', pad:'Padaria', fru:'Frutas, legumes e verduras', out:'Outros'};
const S = (n,q,u,c)=>({n,q,u,cat:c});

const MEAL = {
  pre:{
    title:'Pré-treino leve', opt:true,
    note:'Opcional. Algo pequeno e fácil de digerir. Se o estômago incomodar com o treino logo cedo, treine só com água e café e antecipe o café da manhã.',
    items:[
      {t:'1 banana', s:S('Banana',1,'un',CAT.fru)},
      {t:'Café ou café com um pouco de leite (100 ml)', s:S('Leite',100,'ml',CAT.lat)},
      {t:'Se sentir fome: 1 fatia de pão com 1 colher de sopa de requeijão', o:true}
    ],
    alts:['1 fatia de pão com mel ou geleia','Mamão ou maçã','1 iogurte natural pequeno'],
    swaps:[['Treinar em jejum total','Banana ou pão com mel 20 a 30 min antes']]
  },
  cafe:{
    title:'Café da manhã',
    note:'Depois do treino, junte proteína e carboidrato. Se não der tempo de comer tudo em casa, leve uma parte para comer no trabalho (você pode comer fora do horário do almoço).',
    items:[
      {t:'Café com leite: 1 copo (200 a 250 ml)', s:S('Leite',250,'ml',CAT.lat)},
      {t:'2 ovos mexidos ou em omelete', s:S('Ovos',2,'un',CAT.prot)},
      {t:'1 pão francês ou 2 fatias de pão de forma', s:S('Pão francês',1,'un',CAT.pad)},
      {t:'1 fruta (banana, mamão ou laranja)', s:S('Frutas',1,'un',CAT.fru)}
    ],
    alts:['Pão com ovo e queijo (rápido para comer andando)','Cuscuz com ovo','Tapioca com ovo ou queijo','Iogurte natural com banana e 2 colheres de sopa de aveia'],
    swaps:[['Bolo todo dia','Pão, cuscuz ou tapioca com ovo; bolo de vez em quando'],['Só pão com requeijão','Pão com requeijão + ovo ou queijo (mais proteína)']]
  },
  lm:{
    title:'Lanche da manhã',
    note:'No lugar do salgado. Leve pronto de casa para não depender da padaria.',
    items:[
      {t:'1 pão francês (ou 2 fatias de forma) com 2 fatias de queijo ou 1 ovo', s:S('Pão francês',1,'un',CAT.pad)},
      {t:'Queijo: 2 fatias (≈ 40 g)', s:S('Queijo (minas ou mussarela)',40,'g',CAT.lat), o:false},
      {t:'1 fruta (banana, maçã ou tangerina)', s:S('Frutas',1,'un',CAT.fru)}
    ],
    alts:['2 ovos cozidos + 1 banana','Iogurte natural + 2 colheres de aveia + banana','Pão com pasta de amendoim (1 colher de sopa)','1 punhado de amendoim sem sal (≈ 30 g) + fruta'],
    swaps:[['Salgado de padaria','Sanduíche caseiro ou ovo cozido + fruta: mais proteína, segura mais tempo'],['Refrigerante ou suco de caixinha','Água, café ou leite']]
  },
  alm:{
    title:'Almoço',
    note:'Prato simples e completo: metade de legumes e verduras, um quarto de arroz e feijão, um quarto de proteína. Quantidades são aproximadas: ajuste pela fome.',
    items:[
      {t:'Arroz: 4 colheres de sopa (≈ 110 g cozido)', s:S('Arroz',40,'g',CAT.gra)},
      {t:'Feijão: 1 concha média (≈ 100 g)', s:S('Feijão',40,'g',CAT.gra)},
      {t:'Proteína do tamanho da palma da mão (≈ 120 g pronta) ou 2 ovos', s:S('Carnes e peixes (alternar com ovos)',150,'g',CAT.prot)},
      {t:'Legumes e verduras: metade do prato', s:S('Legumes e verduras',150,'g',CAT.fru)}
    ],
    alts:['Frango (coxa, sobrecoxa ou peito), carne moída, ovos, sardinha em lata e fígado são opções acessíveis','Macarrão ou batata/mandioca no lugar do arroz de vez em quando','Lentilha, grão-de-bico ou ervilha como variação do feijão'],
    swaps:[['Linguiça com frequência','Frango, ovo ou carne moída; linguiça de vez em quando'],['Frito','Grelhado, assado ou cozido'],['Refrigerante','Água ou suco natural sem açúcar']]
  },
  lt:{
    title:'Lanche da tarde no trabalho', opt:true,
    note:'Opcional. Ajuda a chegar no lanche das 17h20 sem muita fome.',
    items:[
      {t:'1 iogurte natural ou 1 copo de leite', s:S('Iogurte natural',1,'un',CAT.lat)},
      {t:'1 fruta', s:S('Frutas',1,'un',CAT.fru)},
      {t:'1 punhado de amendoim ou castanhas (≈ 30 g)', s:S('Amendoim sem sal',30,'g',CAT.out)}
    ],
    alts:['Pão com ovo ou queijo','2 ovos cozidos + fruta','Banana com aveia e leite'],
    swaps:[['Biscoito recheado ou salgadinho','Fruta + punhado de amendoim, ou pão com queijo']]
  },
  pf:{
    title:'Lanche reforçado antes da faculdade',
    note:'É a última refeição forte antes de várias horas de aula. Vale caprichar.',
    items:[
      {t:'Sanduíche reforçado: 1 pão francês grande (ou 2 fatias de forma) com frango desfiado, ovo ou queijo', s:S('Pão francês',1,'un',CAT.pad)},
      {t:'Recheio: queijo (3 fatias ≈ 60 g) ou frango/ovo', s:S('Queijo (minas ou mussarela)',60,'g',CAT.lat)},
      {t:'Leite ou café com leite: 1 copo (250 ml)', s:S('Leite',250,'ml',CAT.lat)},
      {t:'1 fruta', s:S('Frutas',1,'un',CAT.fru)}
    ],
    alts:['Marmita pequena de arroz, feijão e ovo ou frango, se estiver com muita fome','Cuscuz com ovo e leite','Macarrão com carne moída (sobra do almoço)'],
    swaps:[['Só café e bolo','Sanduíche com proteína + fruta: segura mais a fome até a noite']]
  },
  fac:{
    title:'Lanche portátil na faculdade',
    note:'Prepare na véspera e deixe na mochila. Sem geladeira, prefira pão, fruta e amendoim. Ovo e queijo só se ficarem bem embalados e por menos de 2 horas fora da geladeira.',
    items:[
      {t:'1 sanduíche simples (pão + queijo ou pasta de amendoim)', s:S('Pão de forma',2,'fatia',CAT.pad)},
      {t:'1 banana ou maçã', s:S('Frutas',1,'un',CAT.fru)},
      {t:'Garrafa de água (500 ml)'}
    ],
    alts:['1 punhado de amendoim sem sal + banana','2 ovos cozidos descascados + pão','Iogurte natural + aveia (se houver como manter gelado)'],
    swaps:[['Não comer nada até 23h30','Lanche leve no intervalo evita chegar em casa com fome exagerada']]
  },
  jan:{
    title:'Jantar ou ceia',
    note:'Horário tardio: porção um pouco menor que a do almoço, comer sem pressa. Deixe a marmita pronta para só esquentar. Deitar logo após uma refeição muito pesada atrapalha o sono.',
    items:[
      {t:'Arroz: 3 colheres de sopa (≈ 80 g cozido)', s:S('Arroz',30,'g',CAT.gra)},
      {t:'Feijão: 1 concha pequena', s:S('Feijão',30,'g',CAT.gra)},
      {t:'Proteína (≈ 100 g) ou 2 ovos', s:S('Carnes e peixes (alternar com ovos)',120,'g',CAT.prot)},
      {t:'Legumes ou salada, se tiver', s:S('Legumes e verduras',100,'g',CAT.fru)}
    ],
    alts:['Omelete de 2 ovos com legumes + arroz','Cuscuz com ovo','Sopa de legumes com frango (feita no domingo e congelada)','Macarrão com carne moída'],
    swaps:[['Fritura e muita gordura à noite','Cozido, assado ou ovo mexido na frigideira antiaderente'],['Refrigerante','Água']]
  }
};

function mk(o){return Object.assign({enabled:true,remind:false,remindAt:null,days:ALL.slice(),when:null,opt:false},o)}
function meal(id,key,time,days,when,remind,over){
  const m=MEAL[key];
  return mk(Object.assign({id,type:'meal',title:m.title,time,days,when,remind,opt:!!m.opt,
    note:m.note,items:JSON.parse(JSON.stringify(m.items)),alts:m.alts.slice(),swaps:JSON.parse(JSON.stringify(m.swaps))},over||{}));
}

const SEED_ITEMS = [
  // manhã (dia de treino)
  mk({id:'wake_gym',role:'wake',type:'task',title:'Acordar e tomar um copo d\'água',time:'05:00',days:WK,when:'gym',remind:true}),
  meal('pre','pre','05:05',WK,'gym',false),
  mk({id:'gym',type:'gym',title:'Treino',time:null,days:ALL,when:'gym',remind:true}),
  mk({id:'shower',type:'task',title:'Banho e preparo para o trabalho',time:'06:40',days:WK,when:'gym'}),
  meal('cafe_gym','cafe','06:50',WK,'gym',true,{title:'Café da manhã'}),
  // manhã (sem treino)
  mk({id:'wake_off',role:'wake',type:'task',title:'Acordar e tomar um copo d\'água',time:'06:00',days:WK,when:'nogym',remind:true}),
  meal('cafe_off','cafe','06:20',WK,'nogym',true),
  // fim de semana
  mk({id:'wake_we',role:'wake',type:'task',title:'Acordar e tomar um copo d\'água',time:'07:30',days:WE}),
  meal('cafe_we','cafe','09:45',WE,null,true),
  // dia útil
  mk({id:'work',type:'block',title:'Trabalho',time:'07:00',end:'16:45',days:WK,check:false}),
  meal('lm','lm','09:00',WK,null,true),
  meal('alm','alm','12:00',WK,null,true),
  meal('lt','lt','15:00',WK,null,false),
  meal('pf','pf','17:20',WK,null,true),
  mk({id:'college',type:'block',title:'Faculdade',sub:'Aulas, atividades e deslocamento',time:'18:00',end:'23:30',days:WK,check:true}),
  meal('fac','fac','20:45',WK,null,true),
  meal('jan','jan','23:30',WK,null,true),
  mk({id:'bag',type:'task',title:'Separar mochila e lanches de amanhã (10 min)',time:'23:45',days:[1,2,3,4],remind:true}),
  mk({id:'bag_sun',type:'task',title:'Separar mochila, roupa de treino e lanches de segunda',time:'21:15',days:[0],remind:true}),
  mk({id:'sleep',role:'sleep',type:'task',title:'Ir dormir',time:'00:00',days:[1,2,3,4,5,6],remind:true}),
  mk({id:'sleep_sun',role:'sleep',type:'task',title:'Ir dormir (segunda tem treino cedo)',time:'22:00',days:[0],remind:true}),
  // fim de semana: refeições
  meal('alm_we','alm','12:30',WE,null,true),
  meal('lt_we','lt','16:00',WE,null,false),
  meal('jan_we','jan','20:00',WE,null,true),
  mk({id:'batch',type:'task',title:'Cozinhar em lote para a semana (1h a 1h30)',time:'16:00',days:[0],remind:true}),
  // lembretes de água
  mk({id:'w1',type:'water',title:'Beber água',time:'09:30',days:WK,remind:true}),
  mk({id:'w2',type:'water',title:'Beber água',time:'11:30',days:WK,remind:true}),
  mk({id:'w3',type:'water',title:'Beber água',time:'14:00',days:WK,remind:true}),
  mk({id:'w4',type:'water',title:'Beber água',time:'16:30',days:WK,remind:true}),
  mk({id:'w5',type:'water',title:'Beber água',time:'19:30',days:WK,remind:true}),
  mk({id:'w6',type:'water',title:'Beber água',time:'21:30',days:WK,remind:true}),
  mk({id:'w7',type:'water',title:'Beber água',time:'11:00',days:WE,remind:true}),
  mk({id:'w8',type:'water',title:'Beber água',time:'15:00',days:WE,remind:true}),
  mk({id:'w9',type:'water',title:'Beber água',time:'18:30',days:WE,remind:true})
];

/* ===== Ficha de treino provisória (iniciante, corpo inteiro 3x por semana) ===== */
const SEED_PLANS = [
  {id:'A',name:'Treino A',focus:'Corpo inteiro: pernas e empurrar',est:'≈ 60 min',ex:[
    {id:'a1',name:'Leg press 45° (ou agachamento goblet com halter)',sets:3,reps:'10 a 12',rest:'90 s',tip:'Pés na largura dos ombros. Desça controlando até uns 90° de joelho sem tirar o quadril do banco. Não trave os joelhos no topo.'},
    {id:'a2',name:'Supino reto com halteres (ou máquina)',sets:3,reps:'8 a 12',rest:'90 s',tip:'Escápulas juntas e para trás. Desça até a linha do peito, cotovelos a cerca de 45° do tronco.'},
    {id:'a3',name:'Remada baixa na polia (ou máquina)',sets:3,reps:'10 a 12',rest:'90 s',tip:'Peito aberto. Leve os cotovelos para trás sem balançar o tronco.'},
    {id:'a4',name:'Desenvolvimento com halteres sentado',sets:3,reps:'10 a 12',rest:'75 s',tip:'Abdômen firme, sem arquear a lombar. Empurre para cima sem bater os halteres.'},
    {id:'a5',name:'Mesa flexora',sets:3,reps:'10 a 12',rest:'60 s',tip:'Quadril colado no banco. Volte devagar, contando 2 a 3 segundos.'},
    {id:'a6',name:'Prancha abdominal',sets:3,reps:'20 a 40 s',rest:'45 s',tip:'Corpo em linha reta, glúteos contraídos. Pare se a lombar doer.'}
  ]},
  {id:'B',name:'Treino B',focus:'Corpo inteiro: posterior e puxar',est:'≈ 60 min',ex:[
    {id:'b1',name:'Levantamento terra romeno com halteres',sets:3,reps:'8 a 12',rest:'120 s',tip:'Joelhos levemente flexionados, quadril vai para trás, halteres rentes às pernas, coluna neutra. Comece bem leve.'},
    {id:'b2',name:'Puxada frontal (pulldown)',sets:3,reps:'8 a 12',rest:'90 s',tip:'Puxe a barra até a altura da clavícula, ombros para baixo, sem se jogar para trás.'},
    {id:'b3',name:'Supino inclinado com halteres (ou máquina)',sets:3,reps:'8 a 12',rest:'90 s',tip:'Banco a 30° a 45°. Mesma postura do supino reto.'},
    {id:'b4',name:'Cadeira extensora',sets:3,reps:'12 a 15',rest:'60 s',tip:'Sem balançar. Segure 1 segundo no topo e desça devagar.'},
    {id:'b5',name:'Elevação lateral com halteres',sets:3,reps:'12 a 15',rest:'60 s',tip:'Carga leve, cotovelos levemente flexionados, suba até a altura dos ombros.'},
    {id:'b6',name:'Rosca direta + tríceps na polia (alternados)',sets:2,reps:'12 cada',rest:'60 s',tip:'Cotovelos parados ao lado do corpo. Movimento controlado na subida e na descida.'}
  ]},
  {id:'C',name:'Treino C',focus:'Corpo inteiro: mistura e core',est:'≈ 60 min',ex:[
    {id:'c1',name:'Leg press 45° (pés um pouco mais altos)',sets:3,reps:'10 a 12',rest:'90 s',tip:'Pés mais altos pedem mais dos glúteos e posteriores. Mesma amplitude controlada.'},
    {id:'c2',name:'Remada unilateral com halter (serrote)',sets:3,reps:'10 cada lado',rest:'90 s',tip:'Apoie uma mão e o joelho no banco. Puxe o halter em direção ao quadril.'},
    {id:'c3',name:'Supino na máquina (ou flexão com as mãos no banco)',sets:3,reps:'10 a 12',rest:'90 s',tip:'Corpo alinhado na flexão. Ajuste o banco para a máquina ficar na altura do peito.'},
    {id:'c4',name:'Elevação pélvica (ponte de glúteo)',sets:3,reps:'12 a 15',rest:'60 s',tip:'Suba contraindo os glúteos, sem arquear a lombar. Pode usar um halter no quadril.'},
    {id:'c5',name:'Panturrilha em pé (ou no leg press)',sets:3,reps:'12 a 15',rest:'60 s',tip:'Amplitude completa: desça até alongar e suba na ponta dos pés. Pausa de 1 s no topo.'},
    {id:'c6',name:'Elevação de joelhos para abdômen',sets:3,reps:'12 a 15',rest:'45 s',tip:'Sem balançar. Pode ser no chão (joelhos dobrados) se for difícil pendurado.'}
  ]}
];

const TRAIN_GUIDE = [
  ['Aquecimento (5 a 8 min)','5 minutos de caminhada ou bike leve, depois 1 a 2 séries leves do primeiro exercício (cerca de metade da carga de trabalho).'],
  ['Quanto pesar','Nas primeiras 3 a 4 semanas, termine cada série sentindo que ainda dava para fazer mais 2 a 3 repetições. O foco é aprender o movimento.'],
  ['Como progredir','Quando conseguir o número máximo de repetições da faixa em todas as séries, com boa técnica, suba a carga no treino seguinte (a menor anilha disponível, algo como 2 a 5%). Se não conseguir, mantenha.'],
  ['Descanso entre séries','90 a 120 s nos exercícios principais e 45 a 60 s nos mais leves. Use o cronômetro do celular.'],
  ['Recuperação','Três dias por semana com pelo menos um dia livre entre eles. Sono curto atrapalha a recuperação, então esta é a parte mais importante da sua semana.'],
  ['Acompanhamento','Peça ao instrutor da academia para conferir sua técnica nas primeiras semanas.'],
  ['Quando parar','Dor aguda, tontura, falta de ar fora do normal ou dor no peito: pare e procure um médico. Se você está há muito tempo sem atividade física ou tem alguma condição de saúde, converse com um médico antes de começar.']
];

const SEED = {
  v:1,
  settings:{theme:'auto',gymDays:[1,3,6],gymSlot:{week:['05:15','06:40'],weekend:['08:30','09:40']},
    waterGoal:8,glassMl:300,trackMacros:false,kcalGoal:'',protGoal:'',remindOn:false,lead:0,sound:true},
  profile:{height:'185',weightNote:'78 a 80 kg (informado)',age:'',sex:'',exp:'',goal:'',limits:'',classDays:'',bed:'00:00',commute:'',gymInfo:''},
  items:SEED_ITEMS,
  plans:SEED_PLANS,
  schedule:{1:'A',3:'B',6:'C'},
  shop:{checked:{},extra:[]},
  logs:{}
};
