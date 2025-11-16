import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
