import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Sistema Campori Paulistana 2025: DEDUÇÃO de pontos a partir de 1910 pontos máximos
// Classificações: MISSIONÁRIO (≥1496), VOLUNTÁRIO (≥1232), APRENDIZ (<1232)

// Função para calcular classificação baseada na pontuação (Campori)
function getClassification(totalScore: number): string {
  if (totalScore >= 1496) return "MISSIONÁRIO";
  if (totalScore >= 1232) return "VOLUNTÁRIO";
  return "APRENDIZ";
}

// CRITÉRIOS DE PONTUAÇÃO (hard-coded para evitar dependência circular)
const SCORING_CRITERIA = {
  prerequisites: {
    photos: { max: 100, partial: 50 },
    directorPresence: { max: 100, partial: 0 }
  },
  participation: {
    opening: { max: 80, partial: 40 },
    saturdayMorning: { max: 80, partial: 40 },
    saturdayNight: { max: 80, partial: 40 },
    saturdayMeeting: { max: 80, partial: 40 },
    sundayMeeting: { max: 80, partial: 40 }
  },
  general: {
    firstAidKit: { max: 80, partial: 40 },
    secretaryFolder: { max: 80, partial: 40 },
    doorIdentification: { max: 80, partial: 40 },
    badges: { max: 80, partial: 40 },
    uniform: { max: 80, partial: 40 }
  },
  events: {
    twelveHour: { max: 160, partial: 80 },
    carousel: {
      abel: { max: 160, partial: 80 },
      jacob: { max: 160, partial: 80 },
      samson: { max: 160, partial: 80 },
      rahab: { max: 160, partial: 80 },
      gideon: { max: 160, partial: 80 },
      barak: { max: 160, partial: 80 }
    }
  },
  bonus: {
    pastorVisit: { max: 50, partial: 0 },
    adultVolunteer: { max: 50, partial: 0 },
    healthProfessional: { max: 50, partial: 0 }
  },
  demerits: {}
};

// Função para calcular pontuação total (LÓGICA SIMPLIFICADA: penalty = max - earned)
async function calculateTotalScore(ctx: any, clubId: Id<"clubs">, scores: any): Promise<number> {
  if (!scores) return 1910;

  const MAX_SCORE = 1910;
  let totalPenalty = 0;
  let demeritsPenalty = 0;

  // Buscar logs para saber o que foi avaliado
  const activityLogs = await ctx.db
    .query("activityLogs")
    .filter((q: any) => q.eq(q.field("clubId"), clubId))
    .collect();

  const evaluatedCriteria = new Set<string>();
  activityLogs.forEach((log: any) => {
    if (log.scoreChange) {
      const key = `${log.scoreChange.category}_${log.scoreChange.subcategory}`;
      evaluatedCriteria.add(key);
    }
  });

  // Processar categorias
  Object.keys(scores).forEach(category => {
    if (!SCORING_CRITERIA[category as keyof typeof SCORING_CRITERIA]) return;
    const categoryScores = scores[category];
    if (typeof categoryScores !== 'object') return;

    // DEMÉRITOS
    if (category === 'demerits') {
      Object.keys(categoryScores).forEach(key => {
        const demeritValue = categoryScores[key];
        if (typeof demeritValue === 'number' && demeritValue !== 0) {
          demeritsPenalty += Math.abs(demeritValue);
        }
      });
      return;
    }

    // OUTRAS CATEGORIAS
    Object.keys(categoryScores).forEach(key => {
      const earnedPoints = categoryScores[key];
      
      // Processar objetos aninhados (carousel)
      if (typeof earnedPoints !== 'number') {
        if (typeof earnedPoints === 'object') {
          Object.keys(earnedPoints).forEach(subKey => {
            const subValue = earnedPoints[subKey];
            if (typeof subValue !== 'number') return;
            
            const criteriaKey = `${category}_${key}.${subKey}`;
            if (!evaluatedCriteria.has(criteriaKey)) return;
            
            const subCriterion = (SCORING_CRITERIA as any)[category]?.[key]?.[subKey];
            if (!subCriterion) return;
            
            const maxPoints = subCriterion.max || 0;
            const penalty = maxPoints - subValue;
            totalPenalty += Math.max(0, penalty);
          });
        }
        return;
      }

      const criteriaKey = `${category}_${key}`;
      if (!evaluatedCriteria.has(criteriaKey)) return;

      const criterion = (SCORING_CRITERIA as any)[category]?.[key];
      if (!criterion) return;

      const maxPoints = criterion.max || 0;
      const penalty = maxPoints - earnedPoints;
      totalPenalty += Math.max(0, penalty);
    });
  });

  return Math.max(0, MAX_SCORE - totalPenalty - demeritsPenalty);
}

// Reclassificar todos os clubes baseado na pontuação atual
export const reclassifyAllClubs = mutation({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem reclassificar clubes");
    }

    const clubs = await ctx.db.query("clubs").collect();
    let updatedCount = 0;
    
    for (const club of clubs) {
      // Recalcular pontuação total se houver scores
      let newTotalScore = club.totalScore;
      if (club.scores) {
        newTotalScore = await calculateTotalScore(ctx, club._id, club.scores);
      }
      
      // Calcular nova classificação
      const newClassification = getClassification(newTotalScore);
      
      // Atualizar apenas se houver mudança
      if (club.totalScore !== newTotalScore || club.classification !== newClassification) {
        await ctx.db.patch(club._id, {
          totalScore: newTotalScore,
          classification: newClassification,
        });
        
        updatedCount++;
        
        // Registrar log
        await ctx.db.insert("activityLogs", {
          userId: args.adminId,
          userName: admin.name,
          userRole: admin.role,
          action: "RECLASSIFY_CLUB",
          details: `Reclassificou clube ${club.name}: ${club.totalScore} → ${newTotalScore} pts, ${club.classification} → ${newClassification}`,
          timestamp: Date.now(),
          clubId: club._id,
          clubName: club.name,
        });
      }
    }

    return `${updatedCount} clubes foram reclassificados de um total de ${clubs.length}`;
  },
});

// Corrigir classificação de um clube específico
export const fixClubClassification = mutation({
  args: { 
    clubId: v.id("clubs"),
    adminId: v.id("users") 
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || (admin.role !== "admin" && admin.role !== "staff")) {
      throw new Error("Apenas administradores e staff podem corrigir classificações");
    }

    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Clube não encontrado");
    }

    // Recalcular pontuação total se houver scores
    let newTotalScore = club.totalScore;
    if (club.scores) {
      newTotalScore = await calculateTotalScore(ctx, args.clubId, club.scores);
    }
    
    // Calcular nova classificação
    const newClassification = getClassification(newTotalScore);
    
    // Atualizar
    await ctx.db.patch(args.clubId, {
      totalScore: newTotalScore,
      classification: newClassification,
    });
    
    // Registrar log
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "FIX_CLUB_CLASSIFICATION",
      details: `Corrigiu classificação do clube ${club.name}: ${club.totalScore} → ${newTotalScore} pts, ${club.classification} → ${newClassification}`,
      timestamp: Date.now(),
      clubId: args.clubId,
      clubName: club.name,
    });

    return {
      success: true,
      oldScore: club.totalScore,
      newScore: newTotalScore,
      oldClassification: club.classification,
      newClassification,
    };
  },
});

// Verificar e corrigir todas as classificações inconsistentes
export const validateAllClassifications = mutation({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem validar classificações");
    }

    const clubs = await ctx.db.query("clubs").collect();
    const inconsistencies = [];
    
    for (const club of clubs) {
      const expectedClassification = getClassification(club.totalScore);
      
      if (club.classification !== expectedClassification) {
        inconsistencies.push({
          clubId: club._id,
          clubName: club.name,
          currentScore: club.totalScore,
          currentClassification: club.classification,
          expectedClassification,
        });
        
        // Corrigir automaticamente
        await ctx.db.patch(club._id, {
          classification: expectedClassification,
        });
        
        // Registrar log
        await ctx.db.insert("activityLogs", {
          userId: args.adminId,
          userName: admin.name,
          userRole: admin.role,
          action: "VALIDATE_CLASSIFICATION",
          details: `Corrigiu classificação inconsistente do clube ${club.name}: ${club.classification} → ${expectedClassification} (${club.totalScore} pts)`,
          timestamp: Date.now(),
          clubId: club._id,
          clubName: club.name,
        });
      }
    }

    return {
      totalClubs: clubs.length,
      inconsistenciesFound: inconsistencies.length,
      inconsistencies,
      message: inconsistencies.length > 0 
        ? `${inconsistencies.length} inconsistências encontradas e corrigidas`
        : "Todas as classificações estão corretas"
    };
  },
});

export const fixInitialClassifications = mutation({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem corrigir classificações iniciais");
    }

    const clubs = await ctx.db.query("clubs").collect();
    let correctedCount = 0;
    
    // Corrigir clubes que ainda estão com o sistema antigo (3050 pts, classificação HEROI)
    for (const club of clubs) {
      // Recalcular pontuação baseada nos scores atuais
      const newTotalScore = await calculateTotalScore(ctx, club._id, club.scores);
      const newClassification = getClassification(newTotalScore);
      
      // Atualizar se necessário
      if (club.totalScore !== newTotalScore || club.classification !== newClassification) {
        await ctx.db.patch(club._id, {
          totalScore: newTotalScore,
          classification: newClassification,
        });
        correctedCount++;
        
        // Log da correção
        await ctx.db.insert("activityLogs", {
          userId: args.adminId,
          userName: admin.name,
          userRole: admin.role,
          action: "FIX_INITIAL_CLASSIFICATION",
          details: `Migrou clube ${club.name} para sistema Campori: ${club.totalScore} → ${newTotalScore} pts, ${club.classification} → ${newClassification}`,
          timestamp: Date.now(),
          clubId: club._id,
          clubName: club.name,
        });
      }
    }

    return `${correctedCount} clubes migrados para o sistema Campori (1910 pts) de ${clubs.length} total`;
  },
});
