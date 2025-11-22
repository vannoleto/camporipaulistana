import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Marcar critério como avaliado e travado
export const lockCriteria = mutation({
  args: {
    clubId: v.id("clubs"),
    category: v.string(),
    criteriaKey: v.string(),
    subKey: v.optional(v.string()),
    score: v.number(),
    evaluatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verificar se já existe uma avaliação para este critério
    let existingEvaluation = await ctx.db
      .query("evaluatedCriteria")
      .withIndex("by_club_and_criteria", (q) => 
        q.eq("clubId", args.clubId)
         .eq("category", args.category)
         .eq("criteriaKey", args.criteriaKey)
      )
      .filter((q) => 
        args.subKey 
          ? q.eq(q.field("subKey"), args.subKey)
          : q.eq(q.field("subKey"), undefined)
      )
      .first();

    if (existingEvaluation) {
      // Atualizar avaliação existente
      await ctx.db.patch(existingEvaluation._id, {
        score: args.score,
        evaluatedBy: args.evaluatedBy,
        evaluatedAt: Date.now(),
        isLocked: true,
      });
    } else {
      // Criar nova avaliação
      await ctx.db.insert("evaluatedCriteria", {
        clubId: args.clubId,
        category: args.category,
        criteriaKey: args.criteriaKey,
        subKey: args.subKey,
        score: args.score,
        evaluatedBy: args.evaluatedBy,
        evaluatedAt: Date.now(),
        isLocked: true,
      });
    }

    return true;
  },
});

// Buscar critérios avaliados de um clube
export const getEvaluatedCriteria = query({
  args: {
    clubId: v.id("clubs"),
  },
  handler: async (ctx, args) => {
    const evaluatedCriteria = await ctx.db
      .query("evaluatedCriteria")
      .withIndex("by_club", (q) => q.eq("clubId", args.clubId))
      .collect();

    // Organizar em formato mais fácil de usar
    const criteriaMap: Record<string, any> = {};
    
    for (const criteria of evaluatedCriteria) {
      const key = criteria.subKey 
        ? `${criteria.category}.${criteria.criteriaKey}.${criteria.subKey}`
        : `${criteria.category}.${criteria.criteriaKey}`;
      
      criteriaMap[key] = {
        isLocked: criteria.isLocked,
        score: criteria.score,
        evaluatedBy: criteria.evaluatedBy,
        evaluatedAt: criteria.evaluatedAt,
      };
    }

    return criteriaMap;
  },
});

// Verificar se um critério específico está travado
export const isCriteriaLocked = query({
  args: {
    clubId: v.id("clubs"),
    category: v.string(),
    criteriaKey: v.string(),
    subKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const evaluation = await ctx.db
      .query("evaluatedCriteria")
      .withIndex("by_club_and_criteria", (q) => 
        q.eq("clubId", args.clubId)
         .eq("category", args.category)
         .eq("criteriaKey", args.criteriaKey)
      )
      .filter((q) => 
        args.subKey 
          ? q.eq(q.field("subKey"), args.subKey)
          : q.eq(q.field("subKey"), undefined)
      )
      .first();

    return evaluation?.isLocked || false;
  },
});

// Desbloquear critério (apenas admin)
export const unlockCriteria = mutation({
  args: {
    clubId: v.id("clubs"),
    category: v.string(),
    criteriaKey: v.string(),
    subKey: v.optional(v.string()),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verificar se é admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem desbloquear critérios");
    }

    const evaluation = await ctx.db
      .query("evaluatedCriteria")
      .withIndex("by_club_and_criteria", (q) => 
        q.eq("clubId", args.clubId)
         .eq("category", args.category)
         .eq("criteriaKey", args.criteriaKey)
      )
      .filter((q) => 
        args.subKey 
          ? q.eq(q.field("subKey"), args.subKey)
          : q.eq(q.field("subKey"), undefined)
      )
      .first();

    if (evaluation) {
      await ctx.db.patch(evaluation._id, {
        isLocked: false,
      });
    }

    return true;
  },
});

// Limpar todos os travamentos de um clube (para reset de pontuação)
export const clearAllCriteriaLocks = mutation({
  args: {
    clubId: v.optional(v.id("clubs")), // Opcional para limpar todos os clubes
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verificar se é admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem limpar travamentos");
    }

    let evaluations;
    
    if (args.clubId) {
      // Limpar travamentos de um clube específico
      evaluations = await ctx.db
        .query("evaluatedCriteria")
        .withIndex("by_club", (q) => q.eq("clubId", args.clubId!))
        .collect();
    } else {
      // Limpar todos os travamentos de todos os clubes
      evaluations = await ctx.db.query("evaluatedCriteria").collect();
    }

    // Deletar todas as avaliações encontradas
    await Promise.all(evaluations.map(evaluation => ctx.db.delete(evaluation._id)));

    return {
      message: args.clubId 
        ? "Travamentos do clube removidos com sucesso" 
        : "Todos os travamentos removidos com sucesso",
      count: evaluations.length
    };
  },
});

// Buscar clubes não avaliados em um critério específico
export const getUnevaluatedClubs = query({
  args: {
    category: v.string(),
    criteriaKey: v.string(),
    subKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Buscar todos os clubes
    const allClubs = await ctx.db.query("clubs").collect();
    
    // Buscar avaliações existentes para este critério
    const evaluations = await ctx.db
      .query("evaluatedCriteria")
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), args.category),
          q.eq(q.field("criteriaKey"), args.criteriaKey),
          args.subKey 
            ? q.eq(q.field("subKey"), args.subKey)
            : q.eq(q.field("subKey"), undefined)
        )
      )
      .collect();
    
    // IDs dos clubes já avaliados
    const evaluatedClubIds = new Set(evaluations.map(e => e.clubId));
    
    // Retornar apenas clubes não avaliados
    return allClubs.filter(club => !evaluatedClubIds.has(club._id));
  },
});

// Avaliação em lote de múltiplos clubes
export const batchEvaluateClubs = mutation({
  args: {
    clubIds: v.array(v.id("clubs")),
    category: v.string(),
    criteriaKey: v.string(),
    subKey: v.optional(v.string()),
    scoreType: v.union(v.literal("maximum"), v.literal("partial"), v.literal("zero")),
    maxScore: v.number(),
    partialScore: v.number(),
    evaluatorId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se é admin
    const evaluator = await ctx.db.get(args.evaluatorId);
    if (!evaluator || evaluator.role !== "admin") {
      throw new Error("Apenas administradores podem fazer avaliação em lote");
    }

    // Determinar pontuação baseada no tipo (SISTEMA DE PENALIDADE)
    // Clubes começam com pontuação máxima e PERDEM pontos por não atender critérios
    let scoreValue = 0;
    if (args.scoreType === "maximum") {
      // Atendeu 100% = NÃO PERDE NADA = 0 de penalidade
      scoreValue = 0;
    } else if (args.scoreType === "partial") {
      // Atendeu parcialmente = PERDE a diferença entre max e parcial
      scoreValue = -(args.maxScore - args.partialScore);
    } else {
      // Não atendeu = PERDE TUDO = penalidade total
      scoreValue = -args.maxScore;
    }

    const results = [];
    
    // Processar cada clube
    for (const clubId of args.clubIds) {
      try {
        const club = await ctx.db.get(clubId);
        if (!club) {
          results.push({ clubId, success: false, error: "Clube não encontrado" });
          continue;
        }

        // Verificar se já foi avaliado
        const existing = await ctx.db
          .query("evaluatedCriteria")
          .withIndex("by_club_and_criteria", (q) => 
            q.eq("clubId", clubId)
             .eq("category", args.category)
             .eq("criteriaKey", args.criteriaKey)
          )
          .filter((q) => 
            args.subKey 
              ? q.eq(q.field("subKey"), args.subKey)
              : q.eq(q.field("subKey"), undefined)
          )
          .first();

        if (existing) {
          results.push({ 
            clubId, 
            success: false, 
            error: "Clube já foi avaliado neste critério" 
          });
          continue;
        }

        // Criar avaliação travada
        await ctx.db.insert("evaluatedCriteria", {
          clubId,
          category: args.category,
          criteriaKey: args.criteriaKey,
          subKey: args.subKey,
          score: scoreValue,
          evaluatedBy: args.evaluatorId,
          evaluatedAt: Date.now(),
          isLocked: true,
        });

        // Atualizar scores do clube na estrutura detalhada
        const currentScores = club.scores || {};
        const updatedScores = { ...currentScores };
        
        // Garantir que a categoria existe
        if (!updatedScores[args.category]) {
          updatedScores[args.category] = {};
        }
        
        // Determinar o valor da pontuação para a estrutura scores
        // SISTEMA CORRETO: Mostrar quantos pontos o clube GANHOU, não a penalidade
        let displayScore = 0;
        if (args.scoreType === "maximum") {
          // Atendeu 100% = Ganhou pontuação máxima
          displayScore = args.maxScore;
        } else if (args.scoreType === "partial") {
          // Atendeu parcialmente = Ganhou pontuação parcial
          displayScore = args.partialScore;
        } else {
          // Não atendeu = Ganhou 0 pontos
          displayScore = 0;
        }
        
        // Se há subKey, atualizar dentro do objeto aninhado
        if (args.subKey) {
          if (!updatedScores[args.category][args.criteriaKey]) {
            updatedScores[args.category][args.criteriaKey] = {};
          }
          updatedScores[args.category][args.criteriaKey][args.subKey] = displayScore;
        } else {
          // Atualizar diretamente no criteriaKey
          updatedScores[args.category][args.criteriaKey] = displayScore;
        }

        // Obter o valor antigo para o log
        let oldScoreValue = 0;
        if (args.subKey && currentScores[args.category]?.[args.criteriaKey]?.[args.subKey] !== undefined) {
          oldScoreValue = currentScores[args.category][args.criteriaKey][args.subKey];
        } else if (!args.subKey && currentScores[args.category]?.[args.criteriaKey] !== undefined) {
          oldScoreValue = currentScores[args.category][args.criteriaKey];
        }

        // Criar log de atividade
        await ctx.db.insert("activityLogs", {
          clubId,
          clubName: club.name,
          userId: args.evaluatorId,
          userName: evaluator.name,
          userRole: "admin",
          action: "BATCH_EVALUATE",
          timestamp: Date.now(),
          details: args.notes || `Avaliação em lote - ${
            args.scoreType === 'maximum' ? '100% Completo' : 
            args.scoreType === 'partial' ? 'Parcial' : 
            'Não atendeu'
          }`,
          scoreChange: {
            category: args.category,
            subcategory: args.criteriaKey,
            oldValue: oldScoreValue,
            newValue: displayScore,
            difference: displayScore - oldScoreValue,
          },
        });

        // Atualizar clube com a nova estrutura de scores
        await ctx.db.patch(clubId, {
          scores: updatedScores,
        });

        results.push({ clubId, success: true, score: scoreValue });
      } catch (error: any) {
        results.push({ clubId, success: false, error: error.message });
      }
    }

    return {
      totalProcessed: args.clubIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  },
});

// Migração de dados: corrigir avaliações em lote antigas que não têm estrutura scores
export const migrateOldBatchEvaluations = mutation({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query("clubs").collect();
    
    // Buscar critérios de pontuação do systemConfig
    const scoringConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();
    
    if (!scoringConfig) {
      throw new Error("Critérios de pontuação não encontrados no sistema");
    }

    let scoringCriteria;
    try {
      scoringCriteria = JSON.parse(scoringConfig.value as string);
    } catch (e) {
      throw new Error("Erro ao parsear critérios de pontuação");
    }

    let migratedCount = 0;
    const results = [];

    for (const club of clubs) {
      // Verificar se o clube tem avaliações travadas (evaluatedCriteria) mas scores incompletos
      const evaluations = await ctx.db
        .query("evaluatedCriteria")
        .withIndex("by_club_and_criteria", (q) => q.eq("clubId", club._id))
        .collect();

      if (evaluations.length === 0) {
        continue; // Clube sem avaliações, pular
      }

      // Verificar se scores está vazio ou indefinido
      const currentScores = club.scores || {};
      let needsMigration = false;

      // Verificar se alguma avaliação travada não está refletida em scores
      for (const evaluation of evaluations) {
        const { category, criteriaKey, subKey, score } = evaluation;
        
        if (!currentScores[category]) {
          needsMigration = true;
          break;
        }

        if (subKey) {
          // Estrutura aninhada (ex: carousel)
          if (!currentScores[category][criteriaKey] || 
              typeof currentScores[category][criteriaKey] !== 'object' ||
              currentScores[category][criteriaKey][subKey] !== score) {
            needsMigration = true;
            break;
          }
        } else {
          // Estrutura simples
          if (currentScores[category][criteriaKey] !== score) {
            needsMigration = true;
            break;
          }
        }
      }

      if (!needsMigration) {
        continue; // Clube já está correto
      }

      // Reconstruir scores baseado nas avaliações travadas
      const updatedScores: any = { ...currentScores };

      for (const evaluation of evaluations) {
        const { category, criteriaKey, subKey, score } = evaluation;

        // Inicializar categoria se não existir
        if (!updatedScores[category]) {
          updatedScores[category] = {};
        }

        if (subKey) {
          // Estrutura aninhada
          if (!updatedScores[category][criteriaKey] || typeof updatedScores[category][criteriaKey] !== 'object') {
            updatedScores[category][criteriaKey] = {};
          }
          updatedScores[category][criteriaKey][subKey] = score;
        } else {
          // Estrutura simples
          updatedScores[category][criteriaKey] = score;
        }
      }

      // Atualizar o clube
      await ctx.db.patch(club._id, {
        scores: updatedScores,
      });

      migratedCount++;
      results.push({
        clubId: club._id,
        clubName: club.name,
        evaluationsCount: evaluations.length,
        success: true,
      });
    }

    return {
      totalClubsChecked: clubs.length,
      clubsMigrated: migratedCount,
      details: results,
    };
  },
});