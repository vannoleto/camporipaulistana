import { v } from "convex/values";
import { query } from "./_generated/server";

// Query para DEBUGAR e ver EXATAMENTE o que está acontecendo
export const debugClubScoring = query({
  args: { clubName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Pegar um clube específico ou o primeiro
    let club;
    if (args.clubName) {
      club = await ctx.db
        .query("clubs")
        .filter((q) => q.eq(q.field("name"), args.clubName))
        .first();
    } else {
      club = await ctx.db.query("clubs").first();
    }

    if (!club) {
      return { error: "Clube não encontrado" };
    }

    // Pegar logs do clube
    const logs = await ctx.db
      .query("activityLogs")
      .filter((q: any) => q.eq(q.field("clubId"), club._id))
      .collect();

    // Filtrar apenas logs de avaliação (com scoreChange)
    const evaluationLogs = logs.filter(log => log.scoreChange);

    // Construir o Set de avaliados
    const evaluatedCriteria = new Set<string>();
    evaluationLogs.forEach(log => {
      if (log.scoreChange) {
        const key = `${log.scoreChange.category}_${log.scoreChange.subcategory}`;
        evaluatedCriteria.add(key);
      }
    });

    // Calcular penalidade manualmente
    let totalPenalty = 0;
    const details: any[] = [];

    if (club.scores) {
      Object.keys(club.scores).forEach(category => {
        if (category === 'demerits') return;
        
        const categoryScores = club.scores[category];
        if (typeof categoryScores !== 'object') return;

        Object.keys(categoryScores).forEach(key => {
          const earnedPoints = categoryScores[key];
          if (typeof earnedPoints !== 'number') return;

          const criteriaKey = `${category}_${key}`;
          const wasEvaluated = evaluatedCriteria.has(criteriaKey);

          // Aqui está o problema potencial
          details.push({
            category,
            key,
            criteriaKey,
            earnedPoints,
            wasEvaluated,
            willPenalize: wasEvaluated
          });

          if (wasEvaluated) {
            // Assumindo max = 80 para teste
            const penalty = 80 - earnedPoints;
            totalPenalty += Math.max(0, penalty);
          }
        });
      });
    }

    return {
      clubName: club.name,
      currentTotalScore: club.totalScore,
      currentClassification: club.classification,
      totalEvaluationLogs: evaluationLogs.length,
      evaluatedCriteriaCount: evaluatedCriteria.size,
      evaluatedCriteriaList: Array.from(evaluatedCriteria),
      calculatedPenalty: totalPenalty,
      expectedScore: 1910 - totalPenalty,
      scoreDetails: details,
      rawScores: club.scores,
      allLogs: logs.map(log => ({
        action: log.action,
        details: log.details,
        timestamp: log.timestamp,
        scoreChange: log.scoreChange
      }))
    };
  }
});
