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