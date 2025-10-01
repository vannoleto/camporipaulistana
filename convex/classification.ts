import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Função para calcular classificação baseada na pontuação
function getClassification(totalScore: number): string {
  if (totalScore >= 2300) return "HEROI";
  if (totalScore >= 1100) return "FIEL_ESCUDEIRO";
  return "APRENDIZ";
}

// Função para calcular pontuação total
function calculateTotalScore(scores: any): number {
  const prerequisites = scores.prerequisites.photos + scores.prerequisites.directorPresence;
  
  const participation = scores.participation.opening + 
                       scores.participation.saturdayMorning + 
                       scores.participation.saturdayNight + 
                       scores.participation.saturdayMeeting + 
                       scores.participation.sundayMeeting;
  
  const general = scores.general.firstAidKit + 
                 scores.general.secretaryFolder + 
                 scores.general.doorIdentification + 
                 scores.general.badges + 
                 scores.general.uniform;
  
  const events = scores.events.twelveHour + 
                scores.events.carousel.abel + 
                scores.events.carousel.jacob + 
                scores.events.carousel.samson + 
                scores.events.carousel.rahab + 
                scores.events.carousel.gideon + 
                scores.events.carousel.barak;
  
  const bonus = scores.bonus.pastorVisit + 
               scores.bonus.adultVolunteer + 
               scores.bonus.healthProfessional;
  
  const demerits = scores.demerits.driverIssues + 
                  scores.demerits.lackReverence + 
                  scores.demerits.noBadge + 
                  scores.demerits.unaccompaniedChild + 
                  scores.demerits.unauthorizedVisits + 
                  scores.demerits.vandalism + 
                  scores.demerits.silenceViolation + 
                  scores.demerits.disrespect;
  
  return 3050 + prerequisites + participation + general + events + bonus + demerits;
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
    
    for (const club of clubs) {
      if (club.totalScore === 3050 && club.classification === "HEROI") {
        await ctx.db.patch(club._id, { classification: "APRENDIZ" });
        correctedCount++;
      }
    }

    return `${correctedCount} clubes corrigidos de ${clubs.length} total`;
  },
});
