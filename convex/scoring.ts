import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Tipo para critérios dinâmicos
type ScoringCriteria = {
  [category: string]: {
    [key: string]: {
      description: string;
      max: number;
      partial: number;
    };
  };
};

// Estrutura vazia para novo evento - sem critérios pré-definidos
export const SCORING_CRITERIA: ScoringCriteria = {
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

// Obter critérios de pontuação customizados
export const getScoringCriteria = query({
  args: {},
  handler: async (ctx) => {
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

    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    let currentCriteria: ScoringCriteria = { ...SCORING_CRITERIA };
    
    if (existingConfig) {
      try {
        currentCriteria = JSON.parse(existingConfig.value as string) as ScoringCriteria;
      } catch (e) {
        currentCriteria = { ...SCORING_CRITERIA };
      }
    }

    if (!currentCriteria[args.category]) {
      currentCriteria[args.category] = {};
    }

    currentCriteria[args.category][args.key] = {
      description: args.description,
      max: args.max,
      partial: args.partial || 0,
    };

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

    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    let currentCriteria: ScoringCriteria = { ...SCORING_CRITERIA };
    
    if (existingConfig) {
      try {
        currentCriteria = JSON.parse(existingConfig.value as string) as ScoringCriteria;
      } catch (e) {
        currentCriteria = { ...SCORING_CRITERIA };
      }
    }

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

    let currentCriteria: ScoringCriteria = { ...SCORING_CRITERIA };
    
    if (existingConfig) {
      try {
        currentCriteria = JSON.parse(existingConfig.value as string) as ScoringCriteria;
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

// Resetar critérios para estrutura vazia
export const resetScoringCriteria = mutation({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem resetar critérios");
    }

    const existingConfigs = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .collect();

    for (const config of existingConfigs) {
      await ctx.db.delete(config._id);
    }

    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "RESET_SCORING_CRITERIA",
      details: "Resetou critérios de pontuação para estrutura vazia",
      timestamp: Date.now(),
    });

    return true;
  },
});
