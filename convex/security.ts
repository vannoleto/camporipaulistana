import { query } from "./_generated/server";

// Obter estatísticas de segurança
export const getSecurityStats = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db
      .query("users")
      .collect();

    const staffUsers = allUsers.filter(user => user.role === "staff");

    return {
      totalUsers: allUsers.length,
      totalStaff: staffUsers.length,
      activeUsers: allUsers.filter(user => user.isActive).length,
      inactiveUsers: allUsers.filter(user => !user.isActive).length,
    };
  },
});
