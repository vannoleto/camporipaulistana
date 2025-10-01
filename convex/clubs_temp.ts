import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

// Função para calcular classificação baseada na pontuação
function getClassification(totalScore: number): string {
  if (totalScore >= 2300) return "HEROI";
  if (totalScore >= 1100) return "FIEL_ESCUDEIRO";
  return "APRENDIZ";
}

// Obter clube por ID (alias para compatibilidade)
export const getClubById = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clubId);
  },
});

// Atualizar pontuações completas do clube
export const updateClubScores = mutation({
  args: {
    clubId: v.id("clubs"),
    scores: v.any(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar permissões
    if (user.role !== "admin" && user.role !== "staff" && user.clubId !== args.clubId) {
      throw new Error("Você não tem permissão para atualizar este clube");
    }

    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Clube não encontrado");
    }

    // Calcular nova pontuação total
    const newTotalScore = calculateTotalScore(args.scores);
    const newClassification = getClassification(newTotalScore);

    // Atualizar clube
    await ctx.db.patch(args.clubId, {
      scores: args.scores,
      totalScore: newTotalScore,
      classification: newClassification,
    });

    // Registrar log
    await ctx.db.insert("activityLogs", {
      userId: args.userId,
      userName: user.name,
      userRole: user.role,
      action: "UPDATE_CLUB_SCORES",
      details: `Atualizou pontuações do clube ${club.name}`,
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
