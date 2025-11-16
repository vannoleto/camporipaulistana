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
    // Pontuações customizáveis - estrutura dinâmica baseada em scoringCriteria
    scores: v.optional(v.any()),
    lastUpdated: v.optional(v.number()),
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
