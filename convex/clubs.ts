import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

// Função para calcular pontuação máxima baseada nos critérios
const calculateMaximumScore = (criteria: any) => {
  let maxScore = 0;

  // Pré-requisitos
  if (criteria.prerequisites) {
    Object.values(criteria.prerequisites).forEach((item: any) => {
      maxScore += item.max || 0;
    });
  }

  // Participação
  if (criteria.participation) {
    Object.values(criteria.participation).forEach((item: any) => {
      maxScore += item.max || 0;
    });
  }

  // Critérios gerais
  if (criteria.general) {
    Object.values(criteria.general).forEach((item: any) => {
      maxScore += item.max || 0;
    });
  }

  // Eventos
  if (criteria.events) {
    Object.entries(criteria.events).forEach(([key, item]: [string, any]) => {
      if (key === 'carousel') {
        Object.values(item).forEach((carouselItem: any) => {
          maxScore += carouselItem.max || 0;
        });
      } else {
        maxScore += item.max || 0;
      }
    });
  }

  // Bônus
  if (criteria.bonus) {
    Object.values(criteria.bonus).forEach((item: any) => {
      maxScore += item.max || 0;
    });
  }

  return maxScore;
};

// Função para criar estrutura de pontuações inicial (todos com zero)
const createInitialScoreStructure = (criteria: any) => {
  const scores = {
    prerequisites: {} as any,
    participation: {} as any,
    general: {} as any,
    events: {} as any,
    bonus: {} as any,
    demerits: {} as any,
  };

  // Pré-requisitos (iniciam com 0)
  if (criteria.prerequisites) {
    Object.entries(criteria.prerequisites).forEach(([key]: [string, any]) => {
      scores.prerequisites[key] = 0;
    });
  }

  // Participação (iniciam com 0)
  if (criteria.participation) {
    Object.entries(criteria.participation).forEach(([key]: [string, any]) => {
      scores.participation[key] = 0;
    });
  }

  // Critérios gerais (iniciam com 0)
  if (criteria.general) {
    Object.entries(criteria.general).forEach(([key]: [string, any]) => {
      scores.general[key] = 0;
    });
  }

  // Eventos (iniciam com 0)
  if (criteria.events) {
    scores.events = {};
    Object.entries(criteria.events).forEach(([key, item]: [string, any]) => {
      if (key === 'carousel') {
        scores.events.carousel = {};
        Object.entries(item).forEach(([carouselKey]: [string, any]) => {
          scores.events.carousel[carouselKey] = 0;
        });
      } else {
        scores.events[key] = 0;
      }
    });
  }

  // Bônus (iniciam com 0)
  if (criteria.bonus) {
    Object.entries(criteria.bonus).forEach(([key]: [string, any]) => {
      scores.bonus[key] = 0;
    });
  }

  // Deméritos (iniciam com 0)
  if (criteria.demerits) {
    Object.entries(criteria.demerits).forEach(([key]: [string, any]) => {
      scores.demerits[key] = 0;
    });
  }

  return scores;
};

// Função para calcular pontuação total
const calculateTotalScore = (scores: any, criteria?: any) => {
  if (!scores) return 1910; // Pontuação máxima inicial do Campori

  const MAX_SCORE = 1910;
  let totalPenalty = 0;

  // Se não tiver critérios, usar cálculo legacy (compatibilidade)
  if (!criteria) {
    Object.values(scores).forEach((category: any) => {
      if (typeof category === 'object') {
        Object.values(category).forEach((value: any) => {
          if (typeof value === 'number') {
            totalPenalty += Math.abs(value || 0);
          }
        });
      }
    });
    return Math.max(0, MAX_SCORE - totalPenalty);
  }

  // Cálculo dinâmico baseado nos critérios (novo sistema)
  Object.keys(scores).forEach(category => {
    if (!criteria[category]) return; // Ignorar categorias sem critérios

    Object.keys(scores[category]).forEach(key => {
      const earnedPoints = scores[category][key] || 0;
      const criterion = criteria[category][key];
      
      if (!criterion) return; // Ignorar critérios não definidos
      if (typeof earnedPoints !== 'number') return; // Ignorar objetos aninhados

      const maxPoints = criterion.max || 0;
      const partialPoints = criterion.partial || 0;

      // Calcular penalidade baseado no que foi conquistado
      let penalty = 0;

      if (earnedPoints === maxPoints) {
        // Ganhou pontuação máxima → Não perde nada
        penalty = 0;
      } else if (earnedPoints === partialPoints && partialPoints > 0) {
        // Ganhou pontuação parcial → Perde a diferença (max - parcial)
        penalty = maxPoints - partialPoints;
      } else if (earnedPoints === 0) {
        // Ganhou zero → Perde tudo (max)
        penalty = maxPoints;
      } else {
        // Caso customizado: perde a diferença entre max e o que ganhou
        penalty = maxPoints - earnedPoints;
      }

      console.log(`📊 Critério: ${category}.${key} | Ganhou: ${earnedPoints}/${maxPoints} | Penalidade: ${penalty}`);
      totalPenalty += penalty;
    });
  });

  console.log(`📊 Penalidade Total: ${totalPenalty} | Pontuação Final: ${MAX_SCORE - totalPenalty}`);

  // Pontuação final = Máximo (1910) - Penalidades totais
  return Math.max(0, MAX_SCORE - totalPenalty);
};

// Função para determinar classificação (Campori Paulistana 2025)
const getClassification = (totalScore: number): string => {
  if (totalScore >= 1496) return "MISSIONÁRIO";
  if (totalScore >= 1232) return "VOLUNTÁRIO";
  return "APRENDIZ";
};

export const listClubs = query({
  args: { 
    region: v.optional(v.string()),
    classification: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let clubs;
    
    if (args.region) {
      clubs = await ctx.db
        .query("clubs")
        .withIndex("by_region", (q) => q.eq("region", args.region!))
        .collect();
    } else {
      clubs = await ctx.db.query("clubs").collect();
    }
    
    if (args.classification) {
      clubs = clubs.filter(club => club.classification === args.classification);
    }
    
    return clubs.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },
});

export const getClubById = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clubId);
  },
});

export const getRanking = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const clubs = await ctx.db.query("clubs")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    const sortedClubs = clubs.sort((a, b) => b.totalScore - a.totalScore);
    
    return args.limit ? sortedClubs.slice(0, args.limit) : sortedClubs;
  },
});

export const getClassificationStats = query({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query("clubs").collect();
    
    const stats = {
      HEROI: 0,
      FIEL_ESCUDEIRO: 0,
      APRENDIZ: 0,
    };
    
    clubs.forEach(club => {
      if (club.classification && stats.hasOwnProperty(club.classification)) {
        stats[club.classification as keyof typeof stats]++;
      }
    });
    
    return stats;
  },
});

// Query para buscar critérios travados de um clube
export const getLockedCriteria = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, args) => {
    const lockedCriteria = await ctx.db
      .query("evaluatedCriteria")
      .withIndex("by_club", (q) => q.eq("clubId", args.clubId))
      .filter((q) => q.eq(q.field("isLocked"), true))
      .collect();

    return lockedCriteria;
  },
});

// Mutation para Admin desbloquear um critério
export const unlockCriterion = mutation({
  args: {
    clubId: v.id("clubs"),
    category: v.string(),
    criteriaKey: v.string(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem desbloquear critérios");
    }

    const locked = await ctx.db
      .query("evaluatedCriteria")
      .withIndex("by_club_and_criteria", (q) => 
        q.eq("clubId", args.clubId)
         .eq("category", args.category)
         .eq("criteriaKey", args.criteriaKey)
      )
      .first();

    if (locked) {
      await ctx.db.delete(locked._id);
      
      await ctx.db.insert("activityLogs", {
        userId: args.adminId,
        userName: admin.name,
        userRole: admin.role,
        action: "unlock_criterion",
        details: `Desbloqueou critério: ${args.category}.${args.criteriaKey}`,
        timestamp: Date.now(),
        clubId: args.clubId,
      });
    }

    return { success: true };
  },
});

export const getRegionStats = query({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query("clubs").collect();
    
    const regionStats: Record<string, any> = {};
    
    clubs.forEach(club => {
      if (!regionStats[club.region]) {
        regionStats[club.region] = {
          total: 0,
          totalScore: 0,
          classifications: {
            HEROI: 0,
            FIEL_ESCUDEIRO: 0,
            APRENDIZ: 0,
          }
        };
      }
      
      regionStats[club.region].total++;
      regionStats[club.region].totalScore += club.totalScore;
      
      if (club.classification && regionStats[club.region].classifications.hasOwnProperty(club.classification)) {
        regionStats[club.region].classifications[club.classification]++;
      }
    });
    
    // Calcular média de pontuação por região
    Object.keys(regionStats).forEach(region => {
      const stats = regionStats[region];
      stats.averageScore = Math.round(stats.totalScore / stats.total);
    });
    
    return regionStats;
  },
});

export const initializeClubs = mutation({
  args: {},
  handler: async (ctx) => {
    // Buscar critérios de pontuação atuais
    const criteria = await ctx.runQuery(api.scoring.getScoringCriteria, {});
    if (!criteria) {
      throw new Error("Critérios de pontuação não encontrados. Configure os critérios primeiro.");
    }

    // Lista real dos clubes com suas regiões e quantidade de inscritos
    const clubsData = [
  // REGIÃO 01
  { name: "ALVORADA JÚNIOR", region: "R1", membersCount: 29 },
  { name: "ANTARES KIDS", region: "R1", membersCount: 12 },
  { name: "ÁRVORE DA VILA KIDS", region: "R1", membersCount: 27 },
  { name: "CENTAURO KIDS", region: "R1", membersCount: 30 },
  { name: "EVEREST JÚNIOR", region: "R1", membersCount: 12 },
  { name: "GAVIÃO MIRIM", region: "R1", membersCount: 72 },
  { name: "GEDEONES DE LOS ANDES KIDS", region: "R1", membersCount: 47 },
  { name: "HINODÊ", region: "R1", membersCount: 10 },
  { name: "PEQUENOS PIONEIROS", region: "R1", membersCount: 13 },
  { name: "SEMENTINHA", region: "R1", membersCount: 60 },

  // REGIÃO 02
  { name: "ÁGUIAS DE HAIA KIDS", region: "R2", membersCount: 42 },
  { name: "ÁLAMO", region: "R2", membersCount: 15 },
  { name: "BETEL KIDS", region: "R2", membersCount: 5 },
  { name: "BORBA GATO KIDS", region: "R2", membersCount: 16 },
  { name: "CAMPESTRE JUNIOR", region: "R2", membersCount: 46 },
  { name: "ESTRELA DO MAR", region: "R2", membersCount: 13 },
  { name: "ESTRELA DO ORIENTE", region: "R2", membersCount: 10 },
  { name: "FALCÃO DOURADO KIDS", region: "R2", membersCount: 25 },
  { name: "ÓRION KIDS", region: "R2", membersCount: 74 },
  { name: "PEQUENA LUZ", region: "R2", membersCount: 24 },
  { name: "SEMENTES DO REI", region: "R2", membersCount: 28 },
  { name: "TAMANDARÉ KIDS", region: "R2", membersCount: 8 },
  { name: "TUIUIU", region: "R2", membersCount: 14 },
  { name: "XAVANTES DA`RA", region: "R2", membersCount: 20 },

  // REGIÃO 03
  { name: "ÁGUIAS", region: "R3", membersCount: 10 },
  { name: "AJALON KIDS", region: "R3", membersCount: 13 },
  { name: "ÂNCORA PEQUENA LUZ", region: "R3", membersCount: 34 },
  { name: "CRUZEIRO DO SUL KIDS", region: "R3", membersCount: 12 },
  { name: "DIAMANTES", region: "R3", membersCount: 16 },
  { name: "ESTRELA DO VALE KIDS", region: "R3", membersCount: 8 },
  { name: "ÊXODO KIDS", region: "R3", membersCount: 9 },
  { name: "FALCÕES DA ETERNIDADE KIDS", region: "R3", membersCount: 12 },
  { name: "PIONEIROS DO CAMPO KIDS", region: "R3", membersCount: 16 },
  { name: "RUBI KIDS", region: "R3", membersCount: 6 },
  { name: "SOLDADOS DO REI KIDS", region: "R3", membersCount: 19 },
  { name: "VALE DO ÉDEN KIDS", region: "R3", membersCount: 15 },

  // REGIÃO 04
  { name: "ESTRELA DE DAVI", region: "R4", membersCount: 5 },
  { name: "JASPE KIDS", region: "R4", membersCount: 19 },
  { name: "JÓIAS PRECIOSAS (RECANTO)", region: "R4", membersCount: 13 },
  { name: "LUZ CELESTE KIDS", region: "R4", membersCount: 8 },
  { name: "NATSUNAMI MIRIM", region: "R4", membersCount: 6 },
  { name: "NEBULOSA DE ÓRION MIRIM", region: "R4", membersCount: 18 },
  { name: "PEQUENAS ROCHAS", region: "R4", membersCount: 12 },
  { name: "RELUZ KIDS", region: "R4", membersCount: 4 },
  { name: "TOPÁZIO KIDS", region: "R4", membersCount: 14 },

  // REGIÃO 05
  { name: "ÁGUIAS MIRINS", region: "R5", membersCount: 8 },
  { name: "AMIGUINHOS DO CRIADOR", region: "R5", membersCount: 15 },
  { name: "AMIGUINHOS DO REI", region: "R5", membersCount: 9 },
  { name: "BETELGEUSE KIDS", region: "R5", membersCount: 16 },
  { name: "JASPE JÚNIOR", region: "R5", membersCount: 15 },
  { name: "RAPOSO KIDS", region: "R5", membersCount: 40 },
  { name: "SÂNDALOS PEQUENINOS", region: "R5", membersCount: 16 },

// REGIÃO 06
{ name: "AGNUS DEI JUNIOR", region: "R6", membersCount: 18 },
{ name: "CASTORZINHO", region: "R6", membersCount: 16 },
{ name: "CIDADE DE LUZ KIDS", region: "R6", membersCount: 13 },
{ name: "ESTRELINHA DO AMANHÃ", region: "R6", membersCount: 20 },
{ name: "LOBINHOS", region: "R6", membersCount: 16 },
{ name: "LUZES DA AURORA", region: "R6", membersCount: 24 },
{ name: "PEQUENAS ÁGUIAS", region: "R6", membersCount: 24 },
{ name: "PEQUENOS MENSAGEIROS", region: "R6", membersCount: 11 },
{ name: "SEMENTINHAS DO AMANHÃ", region: "R6", membersCount: 16 },
{ name: "VALE DE ESCOL KIDS", region: "R6", membersCount: 19 },

// REGIÃO 07
{ name: "ALPHA KIDS", region: "R7", membersCount: 79 },
{ name: "ANJINHOS DA ESPERANÇA", region: "R7", membersCount: 19 },
{ name: "ARAÇARI KIDS", region: "R7", membersCount: 14 },
{ name: "ESTRELINHAS DE JESUS", region: "R7", membersCount: 9 },
{ name: "LEÕES KIDS", region: "R7", membersCount: 7 },
{ name: "LUMINAR JUNIOR", region: "R7", membersCount: 19 },
{ name: "LUZEIRO MIRIM", region: "R7", membersCount: 32 },
{ name: "OLHOS DE ÁGUIA KIDS", region: "R7", membersCount: 6 },
{ name: "PANDAS DE JESUS", region: "R7", membersCount: 13 },
{ name: "PEQUENINOS DE SIÃO", region: "R7", membersCount: 15 },
{ name: "PEQUENINOS DO AMAZÔNIA", region: "R7", membersCount: 24 },
{ name: "RESPLANDESCENTES KIDS", region: "R7", membersCount: 12 },
{ name: "SILVESTRE MIRIM", region: "R7", membersCount: 12 },
{ name: "SOLDADINHOS DO REI", region: "R7", membersCount: 9 },
{ name: "UNIVERSO KIDS", region: "R7", membersCount: 8 },

// REGIÃO 08
{ name: "ÁGUIAS PRECIOSAS", region: "R8", membersCount: 14 },
{ name: "BENJAMIN", region: "R8", membersCount: 8 },
{ name: "CANAÃ KIDS", region: "R8", membersCount: 1 },
{ name: "CEDRINHOS", region: "R8", membersCount: 34 },
{ name: "ESTRELA DA MANHÃ", region: "R8", membersCount: 58 },
{ name: "LEÕES DE JUDÁ KIDS", region: "R8", membersCount: 9 },
{ name: "PEQUENINOS DA GRAÇA", region: "R8", membersCount: 12 },
{ name: "PEQUENOS ATALAIAS", region: "R8", membersCount: 24 },
{ name: "PEQUENOS RESPLANDECENTES", region: "R8", membersCount: 29 },

// REGIÃO 09
{ name: "ÁGUIA REAL KIDS", region: "R9", membersCount: 21 },
{ name: "ÁGUIAS DE KERIGMA KIDS", region: "R9", membersCount: 12 },
{ name: "ÁGUIAS PEQUENINAS", region: "R9", membersCount: 22 },
{ name: "APUS KIDS", region: "R9", membersCount: 50 },
{ name: "ESTRELA DA COLINA", region: "R9", membersCount: 24 },
{ name: "ESTRELINHAS CELESTES", region: "R9", membersCount: 5 },
{ name: "MONTES KIDS", region: "R9", membersCount: 16 },
{ name: "TIGRE BRANCO KIDS", region: "R9", membersCount: 13 },

// REGIÃO 10
{ name: "EMBAIXADORES KIDS", region: "R10", membersCount: 14 },
{ name: "SENTINELA KID´S", region: "R10", membersCount: 12 },
{ name: "STEFANOS KIDS", region: "R10", membersCount: 20 },
{ name: "VEGA JÚNIOR", region: "R10", membersCount: 34 },

// REGIÃO 11
{ name: "AMIGUINHOS DE JESUS", region: "R11", membersCount: 27 },
{ name: "COALAS DO ESMERALDA", region: "R11", membersCount: 16 },
{ name: "CRISTAL", region: "R11", membersCount: 28 },
{ name: "GUARDIÕES DO REI KIDS", region: "R11", membersCount: 22 },
{ name: "HELIX KIDS", region: "R11", membersCount: 45 },
{ name: "JÓIAS PRECIOSAS KIDS", region: "R11", membersCount: 18 },
{ name: "QUERUBINS DE JESUS", region: "R11", membersCount: 17 },
{ name: "RECANTO DO SOL KIDS", region: "R11", membersCount: 22 },
{ name: "SEMENTES REMANESCENTES", region: "R11", membersCount: 19 },
{ name: "SÍRIUS KIDS", region: "R11", membersCount: 18 },
{ name: "SOLDADINHOS DE CRISTO", region: "R11", membersCount: 8 },
{ name: "TRIBO DE DAVI KIDS", region: "R11", membersCount: 24 },

// REGIÃO 12
{ name: "CURUMIM", region: "R12", membersCount: 34 },
{ name: "EBENÉZER", region: "R12", membersCount: 13 },
{ name: "EL SHADDAY KIDS", region: "R12", membersCount: 10 },
{ name: "LÉO KIDS", region: "R12", membersCount: 19 },
{ name: "PEDRA ANGULAR MIRIM", region: "R12", membersCount: 27 },
{ name: "SOLDADOS KIDS", region: "R12", membersCount: 16 },
{ name: "TIGRE D AGUA", region: "R12", membersCount: 52 }
];

    let createdCount = 0;
    let updatedCount = 0;

    for (const clubData of clubsData) {
      // Verificar se o clube já existe
      const existingClub = await ctx.db
        .query("clubs")
        .filter((q) => q.eq(q.field("name"), clubData.name))
        .first();

      if (!existingClub) {
        // Criar estrutura de pontuações inicial (zero)
        const initialScores = createInitialScoreStructure(criteria);
        const totalScore = calculateTotalScore(initialScores);
        const classification = getClassification(totalScore);

        await ctx.db.insert("clubs", {
          name: clubData.name,
          region: clubData.region,
          totalScore,
          classification,
          isActive: true,
          membersCount: clubData.membersCount,
          scores: initialScores,
        });
        createdCount++;
      } else {
        // Atualizar clube existente se não tiver pontuações definidas
        if (!existingClub.scores) {
          const initialScores = createInitialScoreStructure(criteria);
          const totalScore = calculateTotalScore(initialScores);
          const classification = getClassification(totalScore);

          await ctx.db.patch(existingClub._id, {
            totalScore,
            classification,
            scores: initialScores,
          });
          updatedCount++;
        }
      }
    }

    return `Inicialização concluída! ${createdCount} clubes criados, ${updatedCount} clubes atualizados com pontuação inicial (zero).`;
  },
});

export const resetAllClubScores = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    // Buscar critérios de pontuação atuais - removendo a dependência de query externa (updated)
    // const criteria = await ctx.runQuery(api.scoring.getScoringCriteria, {});
    // if (!criteria) {
    //   throw new Error("Critérios de pontuação não encontrados. Configure os critérios primeiro.");
    // }

    // Buscar todos os clubes existentes
    const clubs = await ctx.db.query("clubs").collect();
    let updatedCount = 0;

    // Sistema de DEDUÇÃO: clubes iniciam com 1910 pts (sem penalidades)
    // Valores zerados = pontuação máxima (1910 pontos)
    const maxScores = {
      prerequisites: {
        photos: 0,
        directorPresence: 0,
      },
      participation: {
        opening: 0,
        saturdayMorning: 0,
        saturdayNight: 0,
        saturdayMeeting: 0,
        sundayMeeting: 0,
      },
      general: {
        firstAidKit: 0,
        secretaryFolder: 0,
        doorIdentification: 0,
        badges: 0,
        uniform: 0,
      },
      events: {
        twelveHour: 0,
        carousel: {
          abel: 0,
          jacob: 0,
          samson: 0,
          rahab: 0,
          gideon: 0,
          barak: 0,
        },
      },
      bonus: {
        pastorVisit: 0,
        adultVolunteer: 0,
        healthProfessional: 0,
      },
      demerits: {
        driverIssues: 0,
        lackReverence: 0,
        noBadge: 0,
        unaccompaniedChild: 0,
        unauthorizedVisits: 0,
        vandalism: 0,
        silenceViolation: 0,
        disrespect: 0,
      },
    };

    // Limpar logs de atividade em lotes pequenos para evitar limite de leituras
    let activityLogsBatch = await ctx.db.query("activityLogs").take(100);
    while (activityLogsBatch.length > 0) {
      for (const log of activityLogsBatch) {
        await ctx.db.delete(log._id);
      }
      activityLogsBatch = await ctx.db.query("activityLogs").take(100);
    }

    // Limpar critérios travados em lotes pequenos
    let evaluatedCriteriaBatch = await ctx.db.query("evaluatedCriteria").take(100);
    while (evaluatedCriteriaBatch.length > 0) {
      for (const criteria of evaluatedCriteriaBatch) {
        await ctx.db.delete(criteria._id);
      }
      evaluatedCriteriaBatch = await ctx.db.query("evaluatedCriteria").take(100);
    }

    // Atualizar todos os clubes em lotes pequenos
    let clubsBatch = await ctx.db.query("clubs").take(100);
    let updatedCount = 0;
    const totalScore = calculateTotalScore(maxScores);
    const classification = getClassification(totalScore);
    
    while (clubsBatch.length > 0) {
      for (const club of clubsBatch) {
        await ctx.db.patch(club._id, {
          totalScore,
          classification,
          scores: maxScores,
        });
        updatedCount++;
      }
      clubsBatch = await ctx.db.query("clubs").take(100);
    }

    // Criar log do reset geral
    await ctx.db.insert("activityLogs", {
      userId: undefined,
      userName: "Sistema",
      userRole: "system",
      action: "system_reset",
      details: `Sistema resetado: ${updatedCount} clubes resetados para pontuação máxima (1910 pts). Todo o histórico de avaliações foi limpo.`,
      timestamp: Date.now(),
    });

    return `Reset concluído! ${updatedCount} clubes foram resetados para pontuação máxima (1910 pontos). Todo o histórico de avaliações foi limpo.`;
  },
});

export const updateClubScores = mutation({
  args: {
    clubId: v.id("clubs"),
    scores: v.any(), // Aceitar qualquer estrutura dinâmica de scores
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Clube não encontrado");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Buscar critérios atuais para validação
    const criteria = await ctx.runQuery(api.scoring.getScoringCriteria, {});
    if (!criteria) {
      throw new Error("Critérios de pontuação não encontrados");
    }

    // Mesclar scores: manter critérios já avaliados + adicionar novos
    const currentScores = club.scores || {};
    const mergedScores: any = JSON.parse(JSON.stringify(currentScores)); // Deep copy

    // Mesclar cada categoria enviada (não exigir todas)
    Object.keys(args.scores).forEach(category => {
      if (!mergedScores[category]) {
        mergedScores[category] = {};
      }
      
      Object.keys(args.scores[category]).forEach(key => {
        // Sobrescrever ou adicionar o score
        mergedScores[category][key] = args.scores[category][key];
      });
    });

    // Validar que as pontuações não excedem os valores máximos permitidos
    // APENAS para as categorias que foram enviadas
    const validateScores = (scores: any, criteria: any) => {
      Object.keys(scores).forEach(category => {
        if (!criteria[category]) return; // Ignorar categorias sem critérios definidos
        
        Object.entries(scores[category]).forEach(([key, value]: [string, any]) => {
          if (!criteria[category][key]) return; // Ignorar critérios não definidos
          
          const maxValue = criteria[category][key]?.max || 0;
          if (value > maxValue) {
            throw new Error(`Pontuação para ${key} não pode exceder ${maxValue} pontos`);
          }
          if (value < 0) {
            throw new Error(`Pontuação para ${key} não pode ser negativa`);
          }
        });
      });
    };

    // Validar APENAS os scores enviados (não os mesclados)
    validateScores(args.scores, criteria);

    // Calcular nova pontuação total e classificação
    const newTotalScore = calculateTotalScore(mergedScores, criteria);
    const newClassification = getClassification(newTotalScore);

    // Registrar mudanças nos logs E travar critérios avaliados
    for (const category of Object.keys(args.scores)) {
      for (const key of Object.keys(args.scores[category])) {
        const oldValue = currentScores[category]?.[key] || 0;
        const newValue = args.scores[category][key];
        
        // IGNORAR objetos aninhados (como carousel) - só processar números
        if (typeof newValue !== 'number') {
          continue;
        }
        
        // Verificar se o critério já está travado
        const existingLock = await ctx.db
          .query("evaluatedCriteria")
          .withIndex("by_club_and_criteria", (q) => 
            q.eq("clubId", args.clubId)
             .eq("category", category)
             .eq("criteriaKey", key)
          )
          .first();

        if (!existingLock) {
          // Travar o critério pela primeira vez
          await ctx.db.insert("evaluatedCriteria", {
            clubId: args.clubId,
            category,
            criteriaKey: key,
            evaluatedBy: args.userId,
            evaluatedAt: Date.now(),
            score: newValue,
            isLocked: true,
          });
        } else if (oldValue !== newValue) {
          // Atualizar score mas manter travado
          await ctx.db.patch(existingLock._id, {
            score: newValue,
            evaluatedBy: args.userId,
            evaluatedAt: Date.now(),
          });
        }
        
        // Log da mudança
        if (oldValue !== newValue) {
          await ctx.db.insert("activityLogs", {
            userId: args.userId,
            userName: user.name,
            userRole: user.role,
            action: "score_update",
            details: `${category}.${key}: ${oldValue} → ${newValue}`,
            timestamp: Date.now(),
            clubId: args.clubId,
            clubName: club.name,
            scoreChange: {
              category,
              subcategory: key,
              oldValue,
              newValue,
              difference: newValue - oldValue,
            },
          });
        }
      }
    }

    // Atualizar clube com scores mesclados
    await ctx.db.patch(args.clubId, {
      scores: mergedScores,
      totalScore: newTotalScore,
      classification: newClassification,
    });

    // Log da avaliação
    await ctx.db.insert("activityLogs", {
      userId: args.userId,
      userName: user.name,
      userRole: user.role,
      action: "club_evaluation",
      details: `Avaliação realizada. Pontuação: ${newTotalScore} pts (${newClassification})`,
      timestamp: Date.now(),
      clubId: args.clubId,
      clubName: club.name,
    });

    return {
      success: true,
      newTotalScore,
      newClassification,
    };
  },
});

export const fixClubScores = mutation({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem executar esta operação");
    }

    const clubs = await ctx.db.query("clubs").collect();
    let fixedCount = 0;

    for (const club of clubs) {
      if (club.scores) {
        const recalculatedScore = calculateTotalScore(club.scores);
        const recalculatedClassification = getClassification(recalculatedScore);
        
        if (club.totalScore !== recalculatedScore || club.classification !== recalculatedClassification) {
          await ctx.db.patch(club._id, {
            totalScore: recalculatedScore,
            classification: recalculatedClassification,
          });
          fixedCount++;
        }
      }
    }

    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "system_maintenance",
      details: `Correção de pontuações executada. ${fixedCount} clubes corrigidos.`,
      timestamp: Date.now(),
    });

    return `Correção concluída! ${fixedCount} clubes tiveram suas pontuações corrigidas.`;
  },
});

export const createClub = mutation({
  args: {
    name: v.string(),
    region: v.string(),
    membersCount: v.number(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem executar esta operação");
    }

    // Verificar se já existe um clube com o mesmo nome
    const existingClub = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingClub) {
      throw new Error("Já existe um clube com este nome");
    }

    // Sistema de DEDUÇÃO: clubes começam com pontuação máxima (1910 pts)
    // Scores zerados = sem penalidades = 1910 pontos
    const initialScores = {
      prerequisites: {
        directorPresence: 0,
      },
      campground: {
        portal: 0,
        clothesline: 0,
        pioneers: 0,
        campfireArea: 0,
        materials: 0,
        tentOrganization: 0,
        security: 0,
        readyCamp: 0,
        chairsOrBench: 0,
      },
      kitchen: {
        tentSetup: 0,
        identification: 0,
        tentSize: 0,
        gasRegister: 0,
        firePosition: 0,
        refrigerator: 0,
        tables: 0,
        extinguisher: 0,
        menu: 0,
        menuDisplay: 0,
        containers: 0,
        uniform: 0,
        handSanitizer: 0,
        washBasin: 0,
        cleaning: 0,
        water: 0,
        identification2: 0,
      },
      participation: {
        opening: 0,
        saturdayMorning: 0,
        saturdayEvening: 0,
        sundayMorning: 0,
        saturdayAfternoon: 0,
        sundayEvening: 0,
        directorMeetingFriday: 0,
        directorMeetingSaturday: 0,
      },
      uniform: {
        programmedUniform: 0,
        badges: 0,
      },
      secretary: {
        firstAidKit: 0,
        secretaryFolder: 0,
        healthFolder: 0,
      },
      events: {
        carousel: 0,
        extraActivities: 0,
        representative: 0,
      },
      bonus: {
        pastorVisit: 0,
        healthProfessional: 0,
      },
      demerits: {
        noIdentification: 0,
        unaccompanied: 0,
        inappropriate: 0,
        campingActivity: 0,
        interference: 0,
        improperClothing: 0,
        disrespect: 0,
        improperBehavior: 0,
        substances: 0,
        sexOpposite: 0,
        artificialFires: 0,
        unauthorizedVehicles: 0,
      },
    };

    const totalScore = calculateTotalScore(initialScores);
    const classification = getClassification(totalScore);

    // Criar o clube
    const clubId = await ctx.db.insert("clubs", {
      name: args.name,
      region: args.region,
      totalScore,
      classification,
      isActive: true,
      membersCount: args.membersCount,
      scores: initialScores,
    });

    // Registrar log da criação
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "club_creation",
      details: `Clube criado: ${args.name} (${args.region}) - ${args.membersCount} inscritos`,
      timestamp: Date.now(),
      clubId,
      clubName: args.name,
    });

    return `Clube "${args.name}" criado com sucesso!`;
  },
});

export const deleteClub = mutation({
  args: { 
    clubId: v.id("clubs"),
    adminId: v.id("users") 
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem executar esta operação");
    }

    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Clube não encontrado");
    }

    // Registrar log da exclusão
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "club_deletion",
      details: `Clube excluído: ${club.name} (${club.region})`,
      timestamp: Date.now(),
      clubId: args.clubId,
      clubName: club.name,
    });

    // Excluir o clube
    await ctx.db.delete(args.clubId);

    return `Clube "${club.name}" excluído com sucesso!`;
  },
});

// Buscar logs de atividade de um clube específico
export const getClubActivityLogs = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, args) => {
    // Buscar todos os logs relacionados ao clube, ordenados por timestamp mais recente
    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("by_club", (q) => q.eq("clubId", args.clubId))
      .order("desc")
      .take(100); // Limitar aos últimos 100 logs

    // Formatar os logs para exibição
    return logs.map(log => ({
      _id: log._id,
      timestamp: log.timestamp || Date.now(),
      userName: log.userName || "Sistema",
      userRole: log.userRole || "unknown",
      action: log.action || "Alteração",
      details: log.details || "",
      scoreChange: log.scoreChange || null,
    }));
  },
});

// Buscar todos os logs de atividade (para DirectorDashboard)
export const getAllActivityLogs = query({
  args: {},
  handler: async (ctx) => {
    // Buscar todos os logs ordenados por timestamp mais recente
    const logs = await ctx.db
      .query("activityLogs")
      .order("desc")
      .take(200); // Limitar aos últimos 200 logs

    // Buscar informações dos clubes para enriquecer os logs
    const clubsMap = new Map();
    for (const log of logs) {
      if (log.clubId && !clubsMap.has(log.clubId)) {
        const club = await ctx.db.get(log.clubId);
        if (club) {
          clubsMap.set(log.clubId, club);
        }
      }
    }

    // Formatar os logs para exibição
    return logs.map(log => {
      const club = log.clubId ? clubsMap.get(log.clubId) : null;
      
      return {
        _id: log._id,
        timestamp: log.timestamp || Date.now(),
        userName: log.userName || "Sistema",
        userRole: log.userRole || "unknown",
        action: log.action || "Alteração",
        details: log.details || "",
        scoreChange: log.scoreChange || null,
        clubId: log.clubId,
        clubName: club?.name || "Clube Desconhecido",
        clubRegion: club?.region || "Região Desconhecida",
      };
    });
  },
});

// Limpar todos os logs de atividade (para reset completo)
export const clearAllActivityLogs = mutation({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verificar se é admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem limpar os logs de atividade");
    }

    // Buscar todos os logs de atividade
    const allLogs = await ctx.db.query("activityLogs").collect();
    
    // Deletar todos os logs
    await Promise.all(allLogs.map(log => ctx.db.delete(log._id)));

    return {
      message: "Todos os logs de atividade foram limpos com sucesso",
      count: allLogs.length
    };
  },

});

// Buscar clube por QR Code
export const getClubByQRData = query({
  args: {
    clubId: v.id("clubs"),
    hash: v.string(),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    // Verificar se o QR code não expirou (máximo 24 horas)
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    if (now - args.timestamp > maxAge) {
      throw new Error("QR Code expirado. Solicite um novo ao diretor do clube.");
    }
    
    // Buscar o clube
    const club = await ctx.db.get(args.clubId);
    
    if (!club) {
      throw new Error("Clube não encontrado.");
    }
    
    // Validar hash (simples verificação de integridade)
    const expectedHash = Buffer.from(`${club._id}-${club.name}-${club.region}-${args.timestamp}`).toString('base64').slice(0, 16);
    
    if (args.hash !== expectedHash) {
      throw new Error("QR Code inválido ou corrompido.");
    }
    
    return {
      ...club,
      qrValidated: true,
      scannedAt: now
    };
  }
});

// Gerar dados para QR Code do clube
export const generateClubQRData = query({
  args: {
    clubId: v.id("clubs")
  },
  handler: async (ctx, args) => {
    const club = await ctx.db.get(args.clubId);
    
    if (!club) {
      throw new Error("Clube não encontrado");
    }
    
    const timestamp = Date.now();
    const hash = Buffer.from(`${club._id}-${club.name}-${club.region}-${timestamp}`).toString('base64').slice(0, 16);
    
    return {
      id: club._id,
      name: club.name,
      region: club.region,
      director: club.director,
      secretary: club.secretary,
      members: club.members || club.membersCount || 0,
      timestamp,
      hash,
      // Dados adicionais para validação
      version: "1.0",
      type: "club_qr"
    };
  }
});

// Função para importar múltiplos clubes de uma vez
export const importClubsBatch = mutation({
  args: {
    clubs: v.array(v.object({
      name: v.string(),
      region: v.string(),
      registeredMembers: v.number(),
    })),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem importar clubes");
    }

    // Estrutura inicial de scores completa (conforme schema - tudo zerado = 1910 pontos)
    const initialScores = {
      prerequisites: {
        directorPresence: 0,
      },
      campground: {
        portal: 0,
        clothesline: 0,
        pioneers: 0,
        campfireArea: 0,
        materials: 0,
        tentOrganization: 0,
        security: 0,
        readyCamp: 0,
        chairsOrBench: 0,
      },
      kitchen: {
        tentSetup: 0,
        identification: 0,
        tentSize: 0,
        gasRegister: 0,
        firePosition: 0,
        refrigerator: 0,
        tables: 0,
        extinguisher: 0,
        menu: 0,
        menuDisplay: 0,
        containers: 0,
        uniform: 0,
        handSanitizer: 0,
        washBasin: 0,
        cleaning: 0,
        water: 0,
        identification2: 0,
      },
      participation: {
        opening: 0,
        saturdayMorning: 0,
        saturdayEvening: 0,
        sundayMorning: 0,
        saturdayAfternoon: 0,
        sundayEvening: 0,
        directorMeetingFriday: 0,
        directorMeetingSaturday: 0,
      },
      uniform: {
        programmedUniform: 0,
        badges: 0,
      },
      secretary: {
        firstAidKit: 0,
        secretaryFolder: 0,
        healthFolder: 0,
      },
      events: {
        carousel: 0,
        extraActivities: 0,
        representative: 0,
      },
      bonus: {
        pastorVisit: 0,
        healthProfessional: 0,
      },
      demerits: {
        noIdentification: 0,
        unaccompanied: 0,
        inappropriate: 0,
        campingActivity: 0,
        interference: 0,
        improperClothing: 0,
        disrespect: 0,
        improperBehavior: 0,
        substances: 0,
        sexOpposite: 0,
        artificialFires: 0,
        unauthorizedVehicles: 0,
      },
    };

    let createdCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const club of args.clubs) {
      // Verificar se já existe clube com esse nome
      const existing = await ctx.db
        .query("clubs")
        .filter((q) => q.eq(q.field("name"), club.name))
        .first();

      if (existing) {
        skippedCount++;
        results.push({ name: club.name, status: "skipped", reason: "já existe" });
        continue;
      }

      // Criar novo clube
      const clubId = await ctx.db.insert("clubs", {
        name: club.name,
        region: club.region,
        membersCount: club.registeredMembers,
        totalScore: 1910, // Pontuação máxima inicial do Campori
        classification: "MISSIONÁRIO",
        scores: initialScores,
        isActive: true,
      });

      createdCount++;
      results.push({ name: club.name, status: "created", id: clubId });

      // Log da criação
      await ctx.db.insert("activityLogs", {
        userId: args.adminId,
        userName: admin.name,
        userRole: admin.role,
        action: "IMPORT_CLUB",
        details: `Importou clube ${club.name} - Região ${club.region} - ${club.registeredMembers} inscritos`,
        timestamp: Date.now(),
        clubId: clubId,
        clubName: club.name,
      });
    }

    return {
      success: true,
      created: createdCount,
      skipped: skippedCount,
      total: args.clubs.length,
      results,
      message: `${createdCount} clubes importados com sucesso! ${skippedCount} já existiam.`
    };
  },
});
