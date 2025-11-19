import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Criar usuário admin padrão
export const createAdminUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Verificar se já existe admin
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();

    if (existingAdmin) {
      return existingAdmin._id;
    }

    // Criar admin padrão
    const adminId = await ctx.db.insert("users", {
      name: "Administrador",
      role: "admin",
      password: "ADMIN2025AVENTURI",
      isActive: true,
      isApproved: true,
      createdAt: Date.now(),
    });

    return adminId;
  },
});

// Login de usuário
export const loginUser = mutation({
  args: {
    name: v.string(),
    password: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user;

    if (args.role === "admin") {
      // Login admin direto
      if (args.password === "ADMIN2025AVENTURI") {
        user = await ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", "admin"))
          .first();
        
        if (!user) {
          // Criar admin se não existir
          const adminId = await ctx.db.insert("users", {
            name: "Administrador",
            role: "admin",
            password: "ADMIN2025AVENTURI",
            isActive: true,
            isApproved: true,
            createdAt: Date.now(),
          });
          user = await ctx.db.get(adminId);
        }
      }
    } else {
      // Login outros usuários
      user = await ctx.db
        .query("users")
        .withIndex("by_name", (q) => q.eq("name", args.name))
        .filter((q) => q.eq(q.field("password"), args.password))
        .first();
    }

    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    if (!user.isActive) {
      throw new Error("Usuário inativo");
    }

    if (!user.isApproved && user.role !== "admin") {
      throw new Error("Usuário aguardando aprovação");
    }

    // Log de login
    await ctx.db.insert("activityLogs", {
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: "LOGIN",
      details: "Usuário fez login no sistema",
      timestamp: Date.now(),
    });

    return user;
  },
});

// Registrar novo usuário
export const registerUser = mutation({
  args: {
    name: v.string(),
    password: v.string(),
    role: v.union(v.literal("mda"), v.literal("regional"), v.literal("director"), v.literal("secretary"), v.literal("staff")),
    region: v.optional(v.string()),
    clubId: v.optional(v.id("clubs")),
    mdaPosition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário já existe
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existingUser) {
      throw new Error("Usuário já existe");
    }

    // Validar campos obrigatórios baseados no role
    if ((args.role === "regional" || args.role === "director" || args.role === "secretary") && !args.region) {
      throw new Error("Região é obrigatória para este tipo de usuário");
    }

    // Validar mdaPosition para usuários MDA
    if (args.role === "mda" && !args.mdaPosition) {
      throw new Error("Cargo é obrigatório para usuários MDA");
    }

    // Validar clube para diretores e secretários
    if ((args.role === "director" || args.role === "secretary") && !args.clubId) {
      throw new Error("Clube é obrigatório para diretores e secretários");
    }

    // Verificar se o clube existe e está na região correta
    if (args.clubId) {
      const club = await ctx.db.get(args.clubId);
      if (!club) {
        throw new Error("Clube não encontrado");
      }
      if (args.region && club.region !== args.region) {
        throw new Error("Clube não pertence à região selecionada");
      }
    }

    // Criar usuário
    const userId = await ctx.db.insert("users", {
      name: args.name,
      role: args.role,
      region: args.region,
      clubId: args.clubId,
      password: args.password,
      mdaPosition: args.mdaPosition,
      isActive: true,
      isApproved: false, // Precisa aprovação do admin
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Listar usuários (admin)
export const listUsers = query({
  args: {
    role: v.optional(v.string()),
    approved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let users;

    if (args.role && args.approved !== undefined) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role as any))
        .filter((q) => q.eq(q.field("isApproved"), args.approved))
        .collect();
    } else if (args.role) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role as any))
        .collect();
    } else if (args.approved !== undefined) {
      users = await ctx.db
        .query("users")
        .withIndex("by_approved", (q) => q.eq("isApproved", args.approved!))
        .collect();
    } else {
      users = await ctx.db.query("users").collect();
    }
    
    // Buscar dados do clube para diretores/secretários
    const usersWithClubs = await Promise.all(
      users.map(async (user) => {
        if (user.clubId) {
          const club = await ctx.db.get(user.clubId);
          return { ...user, club };
        }
        return user;
      })
    );

    return usersWithClubs;
  },
});

// Aprovar usuário (admin)
export const approveUser = mutation({
  args: {
    userId: v.id("users"),
    approved: v.boolean(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem aprovar usuários");
    }

    await ctx.db.patch(args.userId, {
      isApproved: args.approved,
      updatedAt: Date.now(),
    });

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: args.approved ? "APPROVE_USER" : "REJECT_USER",
      details: `${args.approved ? "Aprovou" : "Rejeitou"} usuário: ${user.name} (${user.role})`,
      timestamp: Date.now(),
    });

    return true;
  },
});

// Atualizar usuário
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
      region: v.optional(v.string()),
      clubId: v.optional(v.id("clubs")),
    }),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem atualizar usuários");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    await ctx.db.patch(args.userId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "UPDATE_USER",
      details: `Atualizou usuário: ${user.name}`,
      timestamp: Date.now(),
    });

    return true;
  },
});

// Limpar dados antigos (função temporária)
export const clearOldData = mutation({
  args: {},
  handler: async (ctx) => {
    // Limpar logs de atividade antigos
    const logs = await ctx.db.query("activityLogs").collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
    
    return "Dados antigos limpos";
  },
});

// Deletar usuário
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem deletar usuários");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (user.role === "admin") {
      throw new Error("Não é possível deletar administrador");
    }

    await ctx.db.delete(args.userId);

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "DELETE_USER",
      details: `Deletou usuário: ${user.name} (${user.role})`,
      timestamp: Date.now(),
    });

    return true;
  },
});

// Buscar logs de atividade dos usuários
export const getActivityLogs = query({
  args: {},
  handler: async (ctx) => {
    // Buscar todos os usuários ordenados por último acesso
    const users = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.neq(q.field("role"), "admin"),
          q.eq(q.field("isActive"), true),
          q.eq(q.field("isApproved"), true)
        )
      )
      .collect();

    // Criar logs com informações de último acesso
    const activityLogs = users.map(user => {
      // Para usuários do tipo diretor/secretário, buscar nome do clube
      let clubName = "";
      if (user.clubId && (user.role === "director" || user.role === "secretary")) {
        // Nota: Aqui seria ideal fazer uma query para buscar o clube, mas para simplificar
        // vamos deixar isso para uma versão futura
        clubName = user.clubId.toString();
      }

      return {
        userId: user._id,
        name: user.name,
        role: user.role,
        region: user.region || "",
        clubName: clubName,
        lastLoginAt: user.updatedAt || user.createdAt,
        isActive: user.isActive,
        isApproved: user.isApproved,
      };
    });

    // Ordenar por último acesso (mais recente primeiro)
    return activityLogs.sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0));
  },
});
