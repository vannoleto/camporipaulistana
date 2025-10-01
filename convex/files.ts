import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Gerar URL de upload para arquivos
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Salvar informações do arquivo após upload
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    clubId: v.optional(v.id("clubs")),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Aqui você pode salvar metadados do arquivo se necessário
    // Por enquanto, apenas retornamos o storageId
    return args.storageId;
  },
});

// Obter URL de um arquivo
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Deletar arquivo
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return "Arquivo deletado com sucesso";
  },
});
