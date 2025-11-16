import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Tabela de clubes com dados completos
  clubs: defineTable({
    name: v.string(),
    region: v.string(),
    director: v.optional(v.string()), // Nome do diretor
    secretary: v.optional(v.string()), // Nome do secretário
    members: v.optional(v.number()), // Número de membros (alias para membersCount)
    totalScore: v.number(),
    isActive: v.boolean(),
    membersCount: v.optional(v.number()),
    classification: v.optional(v.string()), // OURO, PRATA, BRONZE, PARTICIPACAO
    // Pontuações detalhadas
    scores: v.optional(v.object({
      prerequisites: v.object({
        directorPresence: v.number(), // 0, 30
      }),
      campground: v.object({
        portal: v.number(), // 0, 20, 40
        clothesline: v.number(), // 0, 5, 10
        pioneers: v.number(), // 0, 5, 10
        campfireArea: v.number(), // 0, 5, 10
        materials: v.number(), // 0, 5, 10
        tentOrganization: v.number(), // 0, 20, 40
        security: v.number(), // 0, 20, 40
        readyCamp: v.number(), // 0, 40, 80
        chairsOrBench: v.number(), // 0, 20, 40
      }),
      kitchen: v.object({
        tentSetup: v.number(), // 0, 10, 20
        identification: v.number(), // 0, 5, 10
        tentSize: v.number(), // 0, 5, 10
        gasRegister: v.number(), // 0, 10, 20
        firePosition: v.number(), // 0, 5, 10
        refrigerator: v.number(), // 0, 5, 10
        tables: v.number(), // 0, 10
        extinguisher: v.number(), // 0, 20
        menu: v.number(), // 0, 30
        menuDisplay: v.number(), // 0, 5, 10
        containers: v.number(), // 0, 5, 10
        uniform: v.number(), // 0, 5, 10
        handSanitizer: v.number(), // 0, 5, 10
        washBasin: v.number(), // 0, 5, 10
        cleaning: v.number(), // 0, 10, 20
        water: v.number(), // 0, 5, 10
        identification2: v.number(), // 0, 5, 10
      }),
      participation: v.object({
        opening: v.number(), // 0, 30, 60
        saturdayMorning: v.number(), // 0, 30, 60
        saturdayEvening: v.number(), // 0, 30, 60
        sundayMorning: v.number(), // 0, 30, 60
        saturdayAfternoon: v.number(), // 0, 30, 60
        sundayEvening: v.number(), // 0, 30, 60
        directorMeetingFriday: v.number(), // 0, 30
        directorMeetingSaturday: v.number(), // 0, 30
      }),
      uniform: v.object({
        programmedUniform: v.number(), // 0, 40, 80
        badges: v.number(), // 0, 20, 40
      }),
      secretary: v.object({
        firstAidKit: v.number(), // 0, 50, 100
        secretaryFolder: v.number(), // 0, 50, 100
        healthFolder: v.number(), // 0, 50, 100
      }),
      events: v.object({
        carousel: v.number(), // 0, 200
        extraActivities: v.number(), // 0, 100
        representative: v.number(), // 0, 50
      }),
      bonus: v.object({
        pastorVisit: v.number(), // 0, 50
        healthProfessional: v.number(), // 0, 100
      }),
      demerits: v.object({
        noIdentification: v.number(), // negativo
        unaccompanied: v.number(), // negativo
        inappropriate: v.number(), // negativo
        campingActivity: v.number(), // negativo
        interference: v.number(), // negativo
        improperClothing: v.number(), // negativo
        disrespect: v.number(), // negativo
        improperBehavior: v.number(), // negativo
        substances: v.number(), // negativo
        sexOpposite: v.number(), // negativo
        artificialFires: v.number(), // negativo
        unauthorizedVehicles: v.number(), // negativo
      }),
    })),
  }).index("by_region", ["region"])
    .index("by_classification", ["classification"]),

  // Tabela de usuários do sistema
  users: defineTable({
    name: v.string(),
    role: v.union(
      v.literal("admin"), 
      v.literal("staff"), 
      v.literal("regional"), 
      v.literal("director"), 
      v.literal("secretary")
    ),
    region: v.optional(v.string()),
    clubId: v.optional(v.id("clubs")),
    password: v.optional(v.string()),
    isActive: v.boolean(),
    isFirstLogin: v.optional(v.boolean()),
    isApproved: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_role", ["role"])
    .index("by_region", ["region"])
    .index("by_club", ["clubId"])
    .index("by_name", ["name"])
    .index("by_approved", ["isApproved"]),

  // Tabela de logs de atividades detalhados
  activityLogs: defineTable({
    userId: v.optional(v.union(v.id("users"), v.string())),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    action: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.optional(v.number()),
    clubId: v.optional(v.id("clubs")),
    clubName: v.optional(v.string()),
    scoreChange: v.optional(v.object({
      category: v.string(),
      subcategory: v.string(),
      oldValue: v.number(),
      newValue: v.number(),
      difference: v.number(),
    })),
  }).index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId"])
    .index("by_club", ["clubId"]),

  // Tabela de arquivos/imagens
  files: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    clubId: v.optional(v.id("clubs")),
    category: v.optional(v.string()),
  }).index("by_club", ["clubId"])
    .index("by_uploader", ["uploadedBy"]),

  // Tabela de configurações do sistema
  systemConfig: defineTable({
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean()),
    description: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Tabela para rastrear critérios avaliados (travados)
  evaluatedCriteria: defineTable({
    clubId: v.id("clubs"),
    category: v.string(), // "prerequisites", "participation", etc.
    criteriaKey: v.string(), // "photos", "directorPresence", etc.
    subKey: v.optional(v.string()), // Para critérios aninhados como carousel.abel
    evaluatedBy: v.id("users"),
    evaluatedAt: v.number(),
    score: v.number(),
    isLocked: v.boolean(),
  }).index("by_club", ["clubId"])
    .index("by_club_and_criteria", ["clubId", "category", "criteriaKey"])
    .index("by_evaluator", ["evaluatedBy"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
