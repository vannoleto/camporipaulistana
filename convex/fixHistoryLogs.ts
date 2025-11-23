import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * MUTATION PARA CORRIGIR LOGS DE HISTÓRICO COM 0 PTS
 * 
 * Este script irá:
 * 1. Buscar todos os logs de atividade que têm newValue = 0
 * 2. Verificar qual foi o critério avaliado
 * 3. Buscar o valor correto do critério no scoringCriteria
 * 4. Atualizar o log com o valor correto
 */

export const fixHistoryLogsWithZeroPoints = mutation({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verificar se é admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem executar esta correção");
    }

    // Buscar critérios de pontuação
    const scoringConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    if (!scoringConfig) {
      throw new Error("Critérios de pontuação não encontrados");
    }

    const scoringCriteria = JSON.parse(scoringConfig.value as string);

    // Buscar todos os logs com newValue = 0 ou muito baixo
    const allLogs = await ctx.db
      .query("activityLogs")
      .filter((q) => 
        q.and(
          q.neq(q.field("scoreChange"), undefined),
          q.eq(q.field("scoreChange.newValue"), 0)
        )
      )
      .collect();

    console.log(`📊 Encontrados ${allLogs.length} logs com 0 pts para corrigir`);

    let corrected = 0;
    let errors = 0;

    for (const log of allLogs) {
      try {
        if (!log.scoreChange) continue;

        const { category, subcategory } = log.scoreChange;

        // Buscar o critério correto
        const criterion = scoringCriteria[category]?.[subcategory];
        if (!criterion) {
          console.log(`⚠️ Critério não encontrado: ${category}.${subcategory}`);
          errors++;
          continue;
        }

        // Determinar o valor correto baseado no detalhe da avaliação
        let correctValue = 0;
        
        // Analisar o texto de "details" para descobrir qual foi a avaliação
        if (log.details?.includes("100% Completo") || log.details?.includes("Atendeu 100%")) {
          correctValue = criterion.max || 0;
        } else if (log.details?.includes("Parcial") || log.details?.includes("parcialmente")) {
          correctValue = criterion.partial || 0;
        } else {
          correctValue = 0; // Não atendeu - mantém 0
        }

        // Se o valor correto é diferente de 0, atualizar
        if (correctValue > 0 && correctValue !== log.scoreChange.newValue) {
          const oldDifference = log.scoreChange.difference;
          const newDifference = correctValue - log.scoreChange.oldValue;

          await ctx.db.patch(log._id, {
            scoreChange: {
              ...log.scoreChange,
              newValue: correctValue,
              difference: newDifference,
            },
          });

          console.log(`✅ Corrigido: ${log.clubName} - ${category}.${subcategory}: 0 → ${correctValue} pts`);
          corrected++;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao corrigir log ${log._id}:`, error.message);
        errors++;
      }
    }

    return {
      success: true,
      message: `Correção concluída: ${corrected} logs corrigidos, ${errors} erros`,
      corrected,
      errors,
      total: allLogs.length,
    };
  },
});
