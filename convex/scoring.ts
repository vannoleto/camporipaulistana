import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Critérios OFICIAIS do XXI Campori Paulistana - Planilha Completa (1.950 pontos)
export const SCORING_CRITERIA = {
  // PRÉ-REQUISITO (30 pontos)
  prerequisites: {
    directorPresence: { 
      max: 30, 
      partial: 0, 
      description: "Presença na reunião de diretores prévia." 
    },
  },

  // ÁREA DE ACAMPAMENTO (280 pontos)
  campground: {
    portal: { 
      max: 40, 
      partial: 20, 
      description: "Portal identificado, criativo e sustentável." 
    },
    clothesline: { 
      max: 10, 
      partial: 5, 
      description: "Local apropriado para estender roupas/toalhas." 
    },
    pioneers: { 
      max: 10, 
      partial: 5, 
      description: "Mínimo de 1 pequena pioneiria (3 amarras)." 
    },
    fencing: { 
      max: 10, 
      partial: 5, 
      description: "Área totalmente cercada (requisitos estéticos/altura)." 
    },
    materials: { 
      max: 10, 
      partial: 5, 
      description: "Local apropriado para depósito de materiais de cantaria." 
    },
    tentOrganization: { 
      max: 40, 
      partial: 20, 
      description: "Barracas e bagagens organizadas (6 itens)." 
    },
    security: { 
      max: 40, 
      partial: 20, 
      description: "Presença do segurança na área." 
    },
    readyCamp: { 
      max: 80, 
      partial: 40, 
      description: "Acampamento pronto e terminado até 1h do dia 20/11." 
    },
    chairsOrBench: { 
      max: 40, 
      partial: 20, 
      description: "Uso de cadeira ou banqueta com quantidade suficiente para cada participante do Campori." 
    }
  },

  // COZINHA (240 pontos)  
  kitchen: {
    tentSetup: { 
      max: 20, 
      partial: 10, 
      description: "Tenda de cozinha bem montada, sem possibilidade de acúmulo de água no teto, e firmemente presa ao chão. A cozinha deverá ser fechadas." 
    },
    identification: { 
      max: 10, 
      partial: 5, 
      description: "Cozinha devidamente identificada com os seguintes itens: Nome do clube, igreja/distrito." 
    },
    tentSize: { 
      max: 10, 
      partial: 5, 
      description: "Tenda com tamanho suficiente para cobertura total dos itens da cozinha (eletrodomésticos, armários, alimentos, etc)" 
    },
    gasRegister: { 
      max: 20, 
      partial: 10, 
      description: "Mangueira e registro de gás em bom estado, dentro da validade, e com o selo do Inmetro. A mangueira não deverá estar em contato direto com o fogo." 
    },
    firePosition: { 
      max: 10, 
      partial: 5, 
      description: "Fogão posicionado a no mínimo 50cm das paredes da tenda da cozinha, sem fazer contato com a lona da tenda." 
    },
    refrigerator: { 
      max: 10, 
      partial: 5, 
      description: "Geladeira posicionada a no mínimo 30cm das paredes da tenda da cozinha, sem fazer contato com a lona da tenda. (Pontuação será dada integralmente aos que não utilizarem geladeira)" 
    },
    tables: { 
      max: 10, 
      partial: 0, 
      description: "As tomadas deverão estar em local seco, afastado das paredes da tenda, e em caso da mesa estar muito perto utilizar geladeira e água" 
    },
    fireExtinguisher: { 
      max: 20, 
      partial: 0, 
      description: "A cozinha deverá ter um extintor de incêndio tipo ABC portátil 3A-20B EN010 64, dentro da validade, com lacre, com selo do Inmetro. O extintor deverá estar em local de fácil acesso." 
    },
    menu: { 
      max: 30, 
      partial: 0, 
      description: "O cardápio deverá ser ovo-lacto-vegetariano." 
    },
    menuDisplay: { 
      max: 10, 
      partial: 5, 
      description: "O cardápio deverá ser exposto na entrada da cozinha diariamente ou para todo o período do Campori." 
    },
    containers: { 
      max: 10, 
      partial: 5, 
      description: "Os alimentos deverão estar alocados em recipientes e prateleiras adequadas." 
    },
    uniform: { 
      max: 10, 
      partial: 5, 
      description: "Toda a equipe da cozinha deverá estar usando avental padronizado com a identificação do clube além de touca e/ou cobertura." 
    },
    handSanitizer: { 
      max: 10, 
      partial: 5, 
      description: "Higienizador para mãos (álcool gel), visível e de fácil acesso, disponível para desbravadores e cozinheiras." 
    },
    washBasin: { 
      max: 10, 
      partial: 5, 
      description: "Laveira com tampa (poderá ser de plástico)." 
    },
    cleaning: { 
      max: 20, 
      partial: 10, 
      description: "Local limpo e adequado para manipulação de alimentos" 
    },
    water: { 
      max: 10, 
      partial: 5, 
      description: "Deve haver água potável disponível, ao alcance de todos, na cozinha." 
    },
    identification2: { 
      max: 10, 
      partial: 5, 
      description: "Saquito identificado contendo prato, copo e talheres para cada desbravador." 
    }
  },

  // PARTICIPAÇÃO (420 pontos)
  participation: {
    opening: { 
      max: 60, 
      partial: 30, 
      description: "100% de presença no programa de abertura" 
    },
    saturdayMorning: { 
      max: 60, 
      partial: 30, 
      description: "100% de presença no programa de sexta-feira de manhã" 
    },
    saturdayEvening: { 
      max: 60, 
      partial: 30, 
      description: "100% de presença no programa de sexta-feira à noite" 
    },
    sundayMorning: { 
      max: 60, 
      partial: 30, 
      description: "100% de presença no programa de sábado pela manhã" 
    },
    saturdayAfternoon: { 
      max: 60, 
      partial: 30, 
      description: "100% de presença no programa de sábado à tarde" 
    },
    sundayEvening: { 
      max: 60, 
      partial: 30, 
      description: "100% de presença no programa de domingo de manhã" 
    },
    directorMeetingFriday: { 
      max: 30, 
      partial: 0, 
      description: "Presença na reunião de diretoria - sexta-feira" 
    },
    directorMeetingSaturday: { 
      max: 30, 
      partial: 0, 
      description: "Presença na reunião de diretoria - sábado" 
    }
  },

  // UNIFORME (120 pontos)
  uniform: {
    saturdayMorning: { 
      max: 80, 
      partial: 40, 
      description: "100% do clube uniformizado na programação de sábado de manhã, com uniforme A" 
    },
    badges: { 
      max: 40, 
      partial: 20, 
      description: "Todas as unidades portando o seu bandeirim devidamente identificado (conforme FIUD) durante a apresentação de sábado pela manhã" 
    }
  },

  // SECRETARIA (300 pontos)
  secretary: {
    firstAidKit: { 
      max: 100, 
      partial: 50, 
      description: "Kit de primeiros socorros completo (conforme descrito no Boletim Verde), com itens dentro do prazo de validade, apresentado no momento do check-in" 
    },
    secretaryFolder: { 
      max: 100, 
      partial: 50, 
      description: "Pasta de secretaria completa (conforme descrita no Boletim Verde), entregue no momento do check-in" 
    },
    healthFolder: { 
      max: 100, 
      partial: 50, 
      description: "Pasta de saúde completa (conforme descrita no Boletim Verde), entregue no momento do check-in" 
    }
  },

  // EVENTOS/PROVAS (350 pontos)
  events: {
    carousel: { 
      max: 200, 
      partial: 0, 
      description: "Participação em um mínimo de 4 provas do carrossel de eventos. A pontuação será somada de acordo com o descritivo do tópico 2" 
    },
    extraActivities: { 
      max: 100, 
      partial: 0, 
      description: "Participação em 2 atividades extras" 
    },
    representative: { 
      max: 50, 
      partial: 0, 
      description: "No mínimo um representante por clube participando do 24h" 
    }
  },

};

// Obter critérios de pontuação
export const getScoringCriteria = query({
  args: {},
  handler: async (ctx) => {
    // Verificar se existe configuração customizada
    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    if (existingConfig) {
      try {
        return JSON.parse(existingConfig.value as string);
      } catch (e) {
        // Se houver erro ao parsear, retornar estrutura vazia
      }
    }

    // Retornar estrutura vazia para novo evento
    return {
      prerequisites: {},
      campground: {},
      kitchen: {},
      participation: {},
      uniform: {},
      secretary: {},
      events: {},
      bonus: {},
      demerits: {}
    };
  },
});

// Atualizar critérios de pontuação (admin)
export const updateScoringCriteria = mutation({
  args: {
    criteria: v.any(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem atualizar critérios");
    }

    // Verificar se já existe configuração
    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        value: JSON.stringify(args.criteria),
        updatedBy: args.adminId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemConfig", {
        key: "scoring_criteria",
        value: JSON.stringify(args.criteria),
        description: "Critérios de pontuação customizados",
        updatedBy: args.adminId,
        updatedAt: Date.now(),
      });
    }

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "UPDATE_SCORING_CRITERIA",
      details: "Atualizou critérios de pontuação do sistema",
      timestamp: Date.now(),
    });

    return true;
  },
});

// Resetar critérios para padrão
export const resetScoringCriteria = mutation({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem resetar critérios");
    }

    // Remover TODAS as configurações customizadas
    const existingConfigs = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .collect();

    for (const config of existingConfigs) {
      await ctx.db.delete(config._id);
    }

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "RESET_SCORING_CRITERIA",
      details: "Resetou critérios de pontuação para padrão - removido SGC",
      timestamp: Date.now(),
    });

    return true;
  },
});

// Calcular pontuação máxima possível
export const getMaxPossibleScore = query({
  args: {},
  handler: async (ctx) => {
    const criteria: any = await ctx.runQuery(api.scoring.getScoringCriteria, {});
    
    let maxTotal = 0;
    
    // Pré-requisitos
    maxTotal += criteria.prerequisites.directorPresence.max;
    
    // Área de Acampamento
    maxTotal += criteria.campground.portal.max;
    maxTotal += criteria.campground.clothesline.max;
    maxTotal += criteria.campground.pioneers.max;
    maxTotal += criteria.campground.campfireArea.max;
    maxTotal += criteria.campground.materials.max;
    maxTotal += criteria.campground.tentOrganization.max;
    maxTotal += criteria.campground.security.max;
    maxTotal += criteria.campground.readyCamp.max;
    maxTotal += criteria.campground.chairsOrBench.max;
    
    // Cozinha
    maxTotal += criteria.kitchen.tentSetup.max;
    maxTotal += criteria.kitchen.identification.max;
    maxTotal += criteria.kitchen.tentSize.max;
    maxTotal += criteria.kitchen.gasRegister.max;
    maxTotal += criteria.kitchen.firePosition.max;
    maxTotal += criteria.kitchen.refrigerator.max;
    maxTotal += criteria.kitchen.tables.max;
    maxTotal += criteria.kitchen.extinguisher.max;
    maxTotal += criteria.kitchen.menu.max;
    maxTotal += criteria.kitchen.menuDisplay.max;
    maxTotal += criteria.kitchen.containers.max;
    maxTotal += criteria.kitchen.uniform.max;
    maxTotal += criteria.kitchen.handSanitizer.max;
    maxTotal += criteria.kitchen.washBasin.max;
    maxTotal += criteria.kitchen.cleaning.max;
    maxTotal += criteria.kitchen.water.max;
    maxTotal += criteria.kitchen.identification2.max;
    
    // Participação
    maxTotal += criteria.participation.opening.max;
    maxTotal += criteria.participation.saturdayMorning.max;
    maxTotal += criteria.participation.saturdayEvening.max;
    maxTotal += criteria.participation.sundayMorning.max;
    maxTotal += criteria.participation.saturdayAfternoon.max;
    maxTotal += criteria.participation.sundayEvening.max;
    maxTotal += criteria.participation.directorMeetingFriday.max;
    maxTotal += criteria.participation.directorMeetingSaturday.max;
    
    // Uniforme
    maxTotal += criteria.uniform.programmedUniform.max;
    maxTotal += criteria.uniform.badges.max;
    
    // Secretaria
    maxTotal += criteria.secretary.firstAidKit.max;
    maxTotal += criteria.secretary.secretaryFolder.max;
    maxTotal += criteria.secretary.healthFolder.max;
    
    // Eventos
    maxTotal += criteria.events.carousel.max;
    maxTotal += criteria.events.extraActivities.max;
    maxTotal += criteria.events.representative.max;
    
    // Bônus
    maxTotal += criteria.bonus.pastorVisit.max;
    maxTotal += criteria.bonus.healthProfessional.max;
    
    return { maxTotal };
  },
});

// Validar pontuação
export const validateScore = query({
  args: {
    category: v.string(),
    subcategory: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const criteria: any = await ctx.runQuery(api.scoring.getScoringCriteria, {});
    
    // Navegar pela estrutura para encontrar o critério
    const categories = args.category.split('.');
    const subcategories = args.subcategory.split('.');
    
    let current = criteria;
    for (const cat of categories) {
      current = current[cat];
      if (!current) {
        return { valid: false, error: "Categoria não encontrada" };
      }
    }
    
    for (const subcat of subcategories) {
      current = current[subcat];
      if (!current) {
        return { valid: false, error: "Subcategoria não encontrada" };
      }
    }
    
    // Verificar se é demérito - valores positivos que representam o valor absoluto das penalidades
    if (args.category === "demerits") {
      if (args.value < 0) {
        return { valid: false, error: "Deméritos devem ser valores positivos (representam penalidades)" };
      }
      return { valid: true };
    }
    
    // Verificar limites para pontuações positivas
    if (args.value < 0) {
      return { valid: false, error: "Pontuação não pode ser negativa" };
    }
    
    if (current.max && args.value > current.max) {
      return { 
        valid: false, 
        error: `Valor máximo permitido: ${current.max}`,
        maxValue: current.max,
        partialValue: current.partial || 0,
      };
    }
    
    return { 
      valid: true,
      maxValue: current.max || 0,
      partialValue: current.partial || 0,
    };
  },
});

// Obter resumo de pontuação de um clube
export const getClubScoreSummary = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, args) => {
    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Clube não encontrado");
    }

    if (!club.scores) {
      throw new Error("Clube não possui pontuações definidas");
    }
    
    const scores = club.scores;
    
    // Calcular totais por categoria
    const summary = {
      prerequisites: {
        total: scores.prerequisites?.directorPresence || 0,
        max: 30,
        items: [
          { name: "Presença Diretor", value: scores.prerequisites?.directorPresence || 0, max: 30 },
        ],
      },
      campground: {
        total: (scores.campground?.portal || 0) + (scores.campground?.clothesline || 0) + 
               (scores.campground?.pioneers || 0) + (scores.campground?.campfireArea || 0) + 
               (scores.campground?.materials || 0) + (scores.campground?.tentOrganization || 0) + 
               (scores.campground?.security || 0) + (scores.campground?.readyCamp || 0) + 
               (scores.campground?.chairsOrBench || 0),
        max: 300,
        items: [
          { name: "Portal", value: scores.campground?.portal || 0, max: 40 },
          { name: "Varal", value: scores.campground?.clothesline || 0, max: 10 },
          { name: "Pioneiras", value: scores.campground?.pioneers || 0, max: 10 },
          { name: "Área Cercada", value: scores.campground?.campfireArea || 0, max: 10 },
          { name: "Depósito Materiais", value: scores.campground?.materials || 0, max: 10 },
          { name: "Organização Barracas", value: scores.campground?.tentOrganization || 0, max: 40 },
          { name: "Segurança", value: scores.campground?.security || 0, max: 40 },
          { name: "Acampamento Pronto", value: scores.campground?.readyCamp || 0, max: 80 },
          { name: "Cadeiras/Banquetas", value: scores.campground?.chairsOrBench || 0, max: 40 },
        ],
      },
      kitchen: {
        total: (scores.kitchen?.tentSetup || 0) + (scores.kitchen?.identification || 0) + 
               (scores.kitchen?.tentSize || 0) + (scores.kitchen?.gasRegister || 0) + 
               (scores.kitchen?.firePosition || 0) + (scores.kitchen?.refrigerator || 0) + 
               (scores.kitchen?.tables || 0) + (scores.kitchen?.extinguisher || 0) + 
               (scores.kitchen?.menu || 0) + (scores.kitchen?.menuDisplay || 0) + 
               (scores.kitchen?.containers || 0) + (scores.kitchen?.uniform || 0) + 
               (scores.kitchen?.handSanitizer || 0) + (scores.kitchen?.washBasin || 0) + 
               (scores.kitchen?.cleaning || 0) + (scores.kitchen?.water || 0) + 
               (scores.kitchen?.identification2 || 0),
        max: 240,
        items: [
          { name: "Montagem Tenda", value: scores.kitchen?.tentSetup || 0, max: 20 },
          { name: "Identificação", value: scores.kitchen?.identification || 0, max: 10 },
          { name: "Tamanho Tenda", value: scores.kitchen?.tentSize || 0, max: 10 },
          { name: "Gás/Mangueira", value: scores.kitchen?.gasRegister || 0, max: 20 },
          { name: "Posição Fogão", value: scores.kitchen?.firePosition || 0, max: 10 },
          { name: "Posição Geladeira", value: scores.kitchen?.refrigerator || 0, max: 10 },
          { name: "Tomadas", value: scores.kitchen?.tables || 0, max: 10 },
          { name: "Extintor", value: scores.kitchen?.extinguisher || 0, max: 20 },
          { name: "Cardápio", value: scores.kitchen?.menu || 0, max: 30 },
          { name: "Exposição Cardápio", value: scores.kitchen?.menuDisplay || 0, max: 10 },
          { name: "Recipientes", value: scores.kitchen?.containers || 0, max: 10 },
          { name: "Uniforme", value: scores.kitchen?.uniform || 0, max: 10 },
          { name: "Higienizador", value: scores.kitchen?.handSanitizer || 0, max: 10 },
          { name: "Lavatório", value: scores.kitchen?.washBasin || 0, max: 10 },
          { name: "Limpeza", value: scores.kitchen?.cleaning || 0, max: 20 },
          { name: "Água Potável", value: scores.kitchen?.water || 0, max: 10 },
          { name: "Saquetas", value: scores.kitchen?.identification2 || 0, max: 10 },
        ],
      },
      participation: {
        total: (scores.participation?.opening || 0) + (scores.participation?.saturdayMorning || 0) + 
               (scores.participation?.saturdayEvening || 0) + (scores.participation?.sundayMorning || 0) + 
               (scores.participation?.saturdayAfternoon || 0) + (scores.participation?.sundayEvening || 0) +
               (scores.participation?.directorMeetingFriday || 0) + (scores.participation?.directorMeetingSaturday || 0),
        max: 420,
        items: [
          { name: "Abertura", value: scores.participation?.opening || 0, max: 60 },
          { name: "Sexta Manhã", value: scores.participation?.saturdayMorning || 0, max: 60 },
          { name: "Sexta Noite", value: scores.participation?.saturdayEvening || 0, max: 60 },
          { name: "Sábado Manhã", value: scores.participation?.sundayMorning || 0, max: 60 },
          { name: "Sábado Tarde", value: scores.participation?.saturdayAfternoon || 0, max: 60 },
          { name: "Domingo Manhã", value: scores.participation?.sundayEvening || 0, max: 60 },
          { name: "Reunião Sexta", value: scores.participation?.directorMeetingFriday || 0, max: 30 },
          { name: "Reunião Sábado", value: scores.participation?.directorMeetingSaturday || 0, max: 30 },
        ],
      },
      uniform: {
        total: (scores.uniform?.programmedUniform || 0) + (scores.uniform?.badges || 0),
        max: 120,
        items: [
          { name: "Uniforme Programado", value: scores.uniform?.programmedUniform || 0, max: 80 },
          { name: "Bandeirins", value: scores.uniform?.badges || 0, max: 40 },
        ],
      },
      secretary: {
        total: (scores.secretary?.firstAidKit || 0) + (scores.secretary?.secretaryFolder || 0) + (scores.secretary?.healthFolder || 0),
        max: 300,
        items: [
          { name: "Kit Primeiros Socorros", value: scores.secretary?.firstAidKit || 0, max: 100 },
          { name: "Pasta Secretaria", value: scores.secretary?.secretaryFolder || 0, max: 100 },
          { name: "Pasta Saúde", value: scores.secretary?.healthFolder || 0, max: 100 },
        ],
      },
      events: {
        total: (scores.events?.carousel || 0) + (scores.events?.extraActivities || 0) + (scores.events?.representative || 0),
        max: 350,
        items: [
          { name: "Carrossel", value: scores.events?.carousel || 0, max: 200 },
          { name: "Atividades Extras", value: scores.events?.extraActivities || 0, max: 100 },
          { name: "Representante 24h", value: scores.events?.representative || 0, max: 50 },
        ],
      },
      bonus: {
        total: (scores.bonus?.pastorVisit || 0) + (scores.bonus?.healthProfessional || 0),
        max: 150,
        items: [
          { name: "Visita Pastor", value: scores.bonus?.pastorVisit || 0, max: 50 },
          { name: "Profissional Saúde", value: scores.bonus?.healthProfessional || 0, max: 100 },
        ],
      },
      demerits: {
        total: Object.values(scores.demerits || {}).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? Math.abs(value) : 0), 0),
        items: Object.entries(scores.demerits || {}).map(([key, value]) => ({
          name: key,
          value: typeof value === 'number' ? Math.abs(value) : 0
        })),
      },
      totalScore: club.totalScore,
      classification: club.classification,
    };

    return summary;
  },
});

// Atualizar pontuação de um clube
export const updateClubScore = mutation({
  args: {
    clubId: v.id("clubs"),
    category: v.string(),
    subcategory: v.string(),
    value: v.number(),
    userId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !["admin", "staff"].includes(user.role)) {
      throw new Error("Acesso negado");
    }

    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Clube não encontrado");
    }

    // Validar pontuação
    const validation = await ctx.runQuery(api.scoring.validateScore, {
      category: args.category,
      subcategory: args.subcategory,
      value: args.value,
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Atualizar a pontuação
    const currentScores = club.scores || {};
    
    // Navegar pela estrutura para definir o valor
    const categoryParts = args.category.split('.');
    const subcategoryParts = args.subcategory.split('.');
    
    let current = currentScores;
    for (const part of categoryParts) {
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    
    for (let i = 0; i < subcategoryParts.length - 1; i++) {
      if (!current[subcategoryParts[i]]) current[subcategoryParts[i]] = {};
      current = current[subcategoryParts[i]];
    }
    
    current[subcategoryParts[subcategoryParts.length - 1]] = args.value;

    // Recalcular pontuação total
    const totalScore = await calculateClubTotalScore(currentScores);
    
    // Determinar classificação
    const classification = getClassification(totalScore);

    // Atualizar clube
    await ctx.db.patch(args.clubId, {
      scores: currentScores,
      totalScore,
      classification,
      lastUpdated: Date.now(),
    });

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.userId,
      userName: user.name,
      userRole: user.role,
      action: "UPDATE_CLUB_SCORE",
      details: `${args.category}.${args.subcategory}: ${args.value} pontos para ${club.name}${args.notes ? ` (${args.notes})` : ''}`,
      targetClubId: args.clubId,
      targetClubName: club.name,
      timestamp: Date.now(),
    });

    return { success: true, totalScore, classification };
  },
});

// Resetar pontuações de um clube
export const resetClubScores = mutation({
  args: {
    clubId: v.id("clubs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !["admin", "staff"].includes(user.role)) {
      throw new Error("Acesso negado");
    }

    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Clube não encontrado");
    }

    await ctx.db.patch(args.clubId, {
      scores: {},
      totalScore: 0,
      classification: "PARTICIPACAO",
      lastUpdated: Date.now(),
    });

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.userId,
      userName: user.name,
      userRole: user.role,
      action: "RESET_CLUB_SCORES",
      details: `Resetou todas as pontuações de ${club.name}`,
      targetClubId: args.clubId,
      targetClubName: club.name,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Calcular pontuação total do clube
async function calculateClubTotalScore(scores: any): Promise<number> {
  let total = 0;
  
  // Pré-requisitos (30 pontos)
  if (scores.prerequisites) {
    total += scores.prerequisites.directorPresence || 0;
  }
  
  // Área de Acampamento (300 pontos)
  if (scores.campground) {
    total += scores.campground.portal || 0;
    total += scores.campground.clothesline || 0;
    total += scores.campground.pioneers || 0;
    total += scores.campground.campfireArea || 0;
    total += scores.campground.materials || 0;
    total += scores.campground.tentOrganization || 0;
    total += scores.campground.security || 0;
    total += scores.campground.readyCamp || 0;
    total += scores.campground.chairsOrBench || 0;
  }
  
  // Cozinha (240 pontos)
  if (scores.kitchen) {
    total += scores.kitchen.tentSetup || 0;
    total += scores.kitchen.identification || 0;
    total += scores.kitchen.tentSize || 0;
    total += scores.kitchen.gasRegister || 0;
    total += scores.kitchen.firePosition || 0;
    total += scores.kitchen.refrigerator || 0;
    total += scores.kitchen.tables || 0;
    total += scores.kitchen.extinguisher || 0;
    total += scores.kitchen.menu || 0;
    total += scores.kitchen.menuDisplay || 0;
    total += scores.kitchen.containers || 0;
    total += scores.kitchen.uniform || 0;
    total += scores.kitchen.handSanitizer || 0;
    total += scores.kitchen.washBasin || 0;
    total += scores.kitchen.cleaning || 0;
    total += scores.kitchen.water || 0;
    total += scores.kitchen.identification2 || 0;
  }
  
  // Participação (420 pontos)
  if (scores.participation) {
    total += scores.participation.opening || 0;
    total += scores.participation.saturdayMorning || 0;
    total += scores.participation.saturdayEvening || 0;
    total += scores.participation.sundayMorning || 0;
    total += scores.participation.saturdayAfternoon || 0;
    total += scores.participation.sundayEvening || 0;
    total += scores.participation.directorMeetingFriday || 0;
    total += scores.participation.directorMeetingSaturday || 0;
  }
  
  // Uniforme (120 pontos)
  if (scores.uniform) {
    total += scores.uniform.programmedUniform || 0;
    total += scores.uniform.badges || 0;
  }
  
  // Secretaria (300 pontos)
  if (scores.secretary) {
    total += scores.secretary.firstAidKit || 0;
    total += scores.secretary.secretaryFolder || 0;
    total += scores.secretary.healthFolder || 0;
  }
  
  // Eventos/Provas (350 pontos)
  if (scores.events) {
    total += scores.events.carousel || 0;
    total += scores.events.extraActivities || 0;
    total += scores.events.representative || 0;
  }
  
  // Bônus (150 pontos)
  if (scores.bonus) {
    total += scores.bonus.pastorVisit || 0;
    total += scores.bonus.healthProfessional || 0;
  }
  
  // Deméritos (penalidades)
  if (scores.demerits) {
    // Somar todas as penalidades (valores devem ser positivos, representando o valor absoluto da penalidade)
    Object.values(scores.demerits).forEach((value: any) => {
      if (typeof value === 'number' && value > 0) {
        total -= value; // Subtrair a penalidade do total
      }
    });
  }
  
  return Math.max(0, total); // Garantir que a pontuação não seja negativa
}

// Determinar classificação baseada na pontuação
function getClassification(totalScore: number): string {
  if (totalScore >= 1500) return "OURO";
  if (totalScore >= 1000) return "PRATA";
  if (totalScore >= 500) return "BRONZE";
  return "PARTICIPACAO";
}

// Obter ranking dos clubes
export const getClubsRanking = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clubs = await ctx.db.query("clubs").collect();
    
    // Ordenar por pontuação total (decrescente) e depois por nome (crescente)
    const ranking = clubs
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return (b.totalScore || 0) - (a.totalScore || 0);
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, args.limit || clubs.length)
      .map((club, index) => ({
        position: index + 1,
        id: club._id,
        name: club.name,
        district: club.district,
        totalScore: club.totalScore || 0,
        classification: club.classification || "PARTICIPACAO",
        lastUpdated: club.lastUpdated,
      }));
    
    return ranking;
  },
});

// Obter estatísticas gerais do sistema
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query("clubs").collect();
    
    const stats = {
      totalClubs: clubs.length,
      clubsByClassification: {
        OURO: clubs.filter(c => c.classification === "OURO").length,
        PRATA: clubs.filter(c => c.classification === "PRATA").length,
        BRONZE: clubs.filter(c => c.classification === "BRONZE").length,
        PARTICIPACAO: clubs.filter(c => c.classification === "PARTICIPACAO").length,
      },
      averageScore: clubs.length > 0 
        ? Math.round(clubs.reduce((sum, club) => sum + (club.totalScore || 0), 0) / clubs.length)
        : 0,
      highestScore: clubs.length > 0 
        ? Math.max(...clubs.map(club => club.totalScore || 0))
        : 0,
      lowestScore: clubs.length > 0 
        ? Math.min(...clubs.map(club => club.totalScore || 0))
        : 0,
    };
    
    return stats;
  },
});

// Criar novo critério de pontuação
export const createScoringCriterion = mutation({
  args: {
    category: v.string(),
    key: v.string(),
    description: v.string(),
    max: v.number(),
    partial: v.optional(v.number()),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem criar critérios");
    }

    // Buscar critérios existentes na systemConfig
    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    let currentCriteria = { ...SCORING_CRITERIA };
    
    if (existingConfig) {
      try {
        currentCriteria = JSON.parse(existingConfig.value as string);
      } catch (e) {
        currentCriteria = { ...SCORING_CRITERIA };
      }
    }

    // Adicionar novo critério
    if (!currentCriteria[args.category]) {
      currentCriteria[args.category] = {};
    }

    currentCriteria[args.category][args.key] = {
      description: args.description,
      max: args.max,
      partial: args.partial || 0,
    };

    // Salvar no banco
    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        value: JSON.stringify(currentCriteria),
        updatedBy: args.adminId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemConfig", {
        key: "scoring_criteria",
        value: JSON.stringify(currentCriteria),
        description: "Critérios de pontuação customizados",
        updatedBy: args.adminId,
        updatedAt: Date.now(),
      });
    }

    // Log
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "CREATE_SCORING_CRITERION",
      details: `Criou critério "${args.description}" na categoria ${args.category}`,
      timestamp: Date.now(),
    });

    return true;
  },
});

// Atualizar critério existente
export const updateScoringCriterion = mutation({
  args: {
    category: v.string(),
    key: v.string(),
    description: v.string(),
    max: v.number(),
    partial: v.optional(v.number()),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem atualizar critérios");
    }

    // Buscar critérios existentes
    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    let currentCriteria = { ...SCORING_CRITERIA };
    
    if (existingConfig) {
      try {
        currentCriteria = JSON.parse(existingConfig.value as string);
      } catch (e) {
        currentCriteria = { ...SCORING_CRITERIA };
      }
    }

    // Atualizar critério
    if (!currentCriteria[args.category]) {
      throw new Error("Categoria não encontrada");
    }

    if (!currentCriteria[args.category][args.key]) {
      throw new Error("Critério não encontrado");
    }

    currentCriteria[args.category][args.key] = {
      description: args.description,
      max: args.max,
      partial: args.partial || 0,
    };

    // Salvar
    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        value: JSON.stringify(currentCriteria),
        updatedBy: args.adminId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemConfig", {
        key: "scoring_criteria",
        value: JSON.stringify(currentCriteria),
        description: "Critérios de pontuação customizados",
        updatedBy: args.adminId,
        updatedAt: Date.now(),
      });
    }

    // Log
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "UPDATE_SCORING_CRITERION",
      details: `Atualizou critério "${args.description}" na categoria ${args.category}`,
      timestamp: Date.now(),
    });

    return true;
  },
});

// Deletar critério
export const deleteScoringCriterion = mutation({
  args: {
    category: v.string(),
    key: v.string(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem deletar critérios");
    }

    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    let currentCriteria = { ...SCORING_CRITERIA };
    
    if (existingConfig) {
      try {
        currentCriteria = JSON.parse(existingConfig.value as string);
      } catch (e) {
        currentCriteria = { ...SCORING_CRITERIA };
      }
    }

    if (currentCriteria[args.category]?.[args.key]) {
      delete currentCriteria[args.category][args.key];
      
      if (existingConfig) {
        await ctx.db.patch(existingConfig._id, {
          value: JSON.stringify(currentCriteria),
          updatedBy: args.adminId,
          updatedAt: Date.now(),
        });
      }

      await ctx.db.insert("activityLogs", {
        userId: args.adminId,
        userName: admin.name,
        userRole: admin.role,
        action: "DELETE_SCORING_CRITERION",
        details: `Deletou critério ${args.key} da categoria ${args.category}`,
        timestamp: Date.now(),
      });
    }

    return true;
  },
});
