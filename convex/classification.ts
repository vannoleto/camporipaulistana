import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Sistema Campori Paulistana 2025: DEDUÇÃO de pontos a partir de 1910 pontos máximos
// Classificações: MISSIONÁRIO (≥1496), VOLUNTÁRIO (≥1232), APRENDIZ (<1232)

// Função para calcular classificação baseada na pontuação (Campori)
function getClassification(totalScore: number): string {
  if (totalScore >= 1496) return "MISSIONÁRIO";
  if (totalScore >= 1232) return "VOLUNTÁRIO";
  return "APRENDIZ";
}

// Função para calcular pontuação total (Sistema de DEDUÇÃO)
function calculateTotalScore(scores: any): number {
  if (!scores) return 1910; // Pontuação máxima inicial

  const MAX_SCORE = 1910;
  let penalties = 0;

  // Calcular penalidades (pontos PERDIDOS) em cada categoria
  if (scores.prerequisites) {
    penalties += Math.abs(scores.prerequisites.photos || 0);
    penalties += Math.abs(scores.prerequisites.directorPresence || 0);
  }
  
  if (scores.participation) {
    penalties += Math.abs(scores.participation.opening || 0);
    penalties += Math.abs(scores.participation.saturdayMorning || 0);
    penalties += Math.abs(scores.participation.saturdayNight || 0);
    penalties += Math.abs(scores.participation.saturdayMeeting || 0);
    penalties += Math.abs(scores.participation.sundayMeeting || 0);
  }
  
  if (scores.general) {
    penalties += Math.abs(scores.general.firstAidKit || 0);
    penalties += Math.abs(scores.general.secretaryFolder || 0);
    penalties += Math.abs(scores.general.doorIdentification || 0);
    penalties += Math.abs(scores.general.badges || 0);
    penalties += Math.abs(scores.general.uniform || 0);
  }
  
  if (scores.events) {
    penalties += Math.abs(scores.events.twelveHour || 0);
    if (scores.events.carousel) {
      penalties += Math.abs(scores.events.carousel.abel || 0);
      penalties += Math.abs(scores.events.carousel.jacob || 0);
      penalties += Math.abs(scores.events.carousel.samson || 0);
      penalties += Math.abs(scores.events.carousel.rahab || 0);
      penalties += Math.abs(scores.events.carousel.gideon || 0);
      penalties += Math.abs(scores.events.carousel.barak || 0);
    }
  }
  
  if (scores.bonus) {
    penalties += Math.abs(scores.bonus.pastorVisit || 0);
    penalties += Math.abs(scores.bonus.adultVolunteer || 0);
    penalties += Math.abs(scores.bonus.healthProfessional || 0);
  }
  
  if (scores.demerits) {
    penalties += Math.abs(scores.demerits.driverIssues || 0);
    penalties += Math.abs(scores.demerits.lackReverence || 0);
    penalties += Math.abs(scores.demerits.noBadge || 0);
    penalties += Math.abs(scores.demerits.unaccompaniedChild || 0);
    penalties += Math.abs(scores.demerits.unauthorizedVisits || 0);
    penalties += Math.abs(scores.demerits.vandalism || 0);
    penalties += Math.abs(scores.demerits.silenceViolation || 0);
    penalties += Math.abs(scores.demerits.disrespect || 0);
  }
  
  // Pontuação final = Máximo (1910) - Penalidades
  return Math.max(0, MAX_SCORE - penalties);
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
        newTotalScore = calculateTotalScore(club.scores);
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
      newTotalScore = calculateTotalScore(club.scores);
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
      const newTotalScore = calculateTotalScore(club.scores);
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
