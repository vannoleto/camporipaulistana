import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Definições dos critérios de pontuação
export const SCORING_CRITERIA = {
  prerequisites: {
    photos: { max: 300, partial: 0, description: "Enviar fotos no SGC (logo, clube, diretor) no prazo" },
    directorPresence: { max: 50, partial: 0, description: "Presença do diretor ou representante na reunião prévia" },
  },
  participation: {
    opening: { max: 100, partial: 30, description: "Clube 100% presente na abertura" },
    saturdayMorning: { max: 100, partial: 30, description: "Clube 100% presente na programação de sábado manhã" },
    saturdayNight: { max: 100, partial: 30, description: "Clube 100% presente na programação de sábado noite" },
    saturdayMeeting: { max: 50, partial: 0, description: "Presença do diretor/representante na reunião de sábado" },
    sundayMeeting: { max: 50, partial: 0, description: "Presença do diretor/representante na reunião de domingo" },
  },
  general: {
    firstAidKit: { max: 300, partial: 150, description: "Maleta de primeiros socorros no check-in" },
    secretaryFolder: { max: 500, partial: 250, description: "Pasta de secretaria entregue no check-in" },
    doorIdentification: { max: 200, partial: 0, description: "Porta dos quartos/corredores identificada até 9h de sábado" },
    badges: { max: 200, partial: 0, description: "Membros com crachá identificado" },
    uniform: { max: 100, partial: 50, description: "Clube 100% uniforme de gala no sábado manhã" },
  },
  events: {
    twelveHour: { max: 100, partial: 0, description: "Participação de ao menos 1 aventureiro no 12h" },
    carousel: {
      abel: { max: 100, partial: 0, description: "Oferta na Arca – Abel e Noé (obediência)" },
      jacob: { max: 100, partial: 0, description: "Gigantes e Nações – Jacó e Davi (aliança e confiança)" },
      samson: { max: 100, partial: 0, description: "Força da Verdade – Sansão (força vem de Deus)" },
      rahab: { max: 100, partial: 0, description: "Caminho até o Céu – Raabe (escolher Jesus)" },
      gideon: { max: 100, partial: 0, description: "Exército Colaborador – Gideão (união e coragem)" },
      barak: { max: 100, partial: 0, description: "Olhos da Fé – Baraque e Jefté (fé e valentia)" },
    },
  },
  bonus: {
    pastorVisit: { max: 100, partial: 0, description: "Visita do pastor distrital" },
    adultVolunteer: { max: 100, partial: 0, description: "Clube disponibiliza adulto para escala de plantão" },
    healthProfessional: { max: 100, partial: 0, description: "Clube apresenta profissional de saúde para plantão" },
  },
  demerits: {
    driverIssues: { penalty: -150, description: "Motorista em locais indevidos/dormindo" },
    lackReverence: { penalty: -30, description: "Falta de reverência em cultos" },
    noBadge: { penalty: -20, description: "Membro sem crachá (por membro)" },
    unaccompaniedChild: { penalty: -50, description: "Aventureiro desacompanhado (por aventureiro)" },
    unauthorizedVisits: { penalty: -150, description: "Visitas fora do período (por pessoa)" },
    vandalism: { penalty: -50, description: "Integrante depreda instalações" },
    silenceViolation: { penalty: -50, description: "Desrespeitar horário de silêncio" },
    disrespect: { penalty: -50, description: "Desrespeitar autoridades (staff, coordenação, pastores)" },
  },
};

// Obter critérios de pontuação
export const getScoringCriteria = query({
  args: {},
  handler: async (ctx) => {
    // Primeiro tenta buscar critérios customizados do banco
    const customCriteria = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    if (customCriteria) {
      return JSON.parse(customCriteria.value as string);
    }

    // Se não houver customização, retorna os critérios padrão
    return SCORING_CRITERIA;
  },
});

// Atualizar critérios de pontuação (admin)
export const updateScoringCriteria = mutation({
  args: {
    criteria: v.any(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem atualizar critérios");
    }

    // Verificar se já existe configuração
    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        value: JSON.stringify(args.criteria),
        updatedBy: args.adminId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemConfig", {
        key: "scoring_criteria",
        value: JSON.stringify(args.criteria),
        description: "Critérios de pontuação customizados",
        updatedBy: args.adminId,
        updatedAt: Date.now(),
      });
    }

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "UPDATE_SCORING_CRITERIA",
      details: "Atualizou critérios de pontuação do sistema",
      timestamp: Date.now(),
    });

    return true;
  },
});

// Resetar critérios para padrão
export const resetScoringCriteria = mutation({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Apenas administradores podem resetar critérios");
    }

    // Remover configuração customizada
    const existingConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", "scoring_criteria"))
      .first();

    if (existingConfig) {
      await ctx.db.delete(existingConfig._id);
    }

    // Log da ação
    await ctx.db.insert("activityLogs", {
      userId: args.adminId,
      userName: admin.name,
      userRole: admin.role,
      action: "RESET_SCORING_CRITERIA",
      details: "Resetou critérios de pontuação para padrão",
      timestamp: Date.now(),
    });

    return true;
  },
});

// Calcular pontuação máxima possível
export const getMaxPossibleScore = query({
  args: {},
  handler: async (ctx) => {
    const criteria: any = await ctx.runQuery(api.scoring.getScoringCriteria, {});
    const baseScore = 3050;
    
    let maxAdditional = 0;
    
    // Pré-requisitos
    maxAdditional += criteria.prerequisites.photos.max;
    maxAdditional += criteria.prerequisites.directorPresence.max;
    
    // Participação
    maxAdditional += criteria.participation.opening.max;
    maxAdditional += criteria.participation.saturdayMorning.max;
    maxAdditional += criteria.participation.saturdayNight.max;
    maxAdditional += criteria.participation.saturdayMeeting.max;
    maxAdditional += criteria.participation.sundayMeeting.max;
    
    // Gerais
    maxAdditional += criteria.general.firstAidKit.max;
    maxAdditional += criteria.general.secretaryFolder.max;
    maxAdditional += criteria.general.doorIdentification.max;
    maxAdditional += criteria.general.badges.max;
    maxAdditional += criteria.general.uniform.max;
    
    // Eventos
    maxAdditional += criteria.events.twelveHour.max;
    maxAdditional += criteria.events.carousel.abel.max;
    maxAdditional += criteria.events.carousel.jacob.max;
    maxAdditional += criteria.events.carousel.samson.max;
    maxAdditional += criteria.events.carousel.rahab.max;
    maxAdditional += criteria.events.carousel.gideon.max;
    maxAdditional += criteria.events.carousel.barak.max;
    
    // Bônus
    maxAdditional += criteria.bonus.pastorVisit.max;
    maxAdditional += criteria.bonus.adultVolunteer.max;
    maxAdditional += criteria.bonus.healthProfessional.max;
    
    return {
      baseScore,
      maxAdditional,
      maxTotal: baseScore + maxAdditional,
    };
  },
});

// Validar pontuação
export const validateScore = query({
  args: {
    category: v.string(),
    subcategory: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const criteria: any = await ctx.runQuery(api.scoring.getScoringCriteria, {});
    
    // Navegar pela estrutura para encontrar o critério
    const categories = args.category.split('.');
    const subcategories = args.subcategory.split('.');
    
    let current = criteria;
    for (const cat of categories) {
      current = current[cat];
      if (!current) {
        return { valid: false, error: "Categoria não encontrada" };
      }
    }
    
    for (const subcat of subcategories) {
      current = current[subcat];
      if (!current) {
        return { valid: false, error: "Subcategoria não encontrada" };
      }
    }
    
    // Verificar se é demérito - valores positivos que representam o valor absoluto das penalidades
    if (args.category === "demerits") {
      if (args.value < 0) {
        return { valid: false, error: "Deméritos devem ser valores positivos (representam penalidades)" };
      }
      return { valid: true };
    }
    
    // Verificar limites para pontuações positivas
    if (args.value < 0) {
      return { valid: false, error: "Pontuação não pode ser negativa" };
    }
    
    if (current.max && args.value > current.max) {
      return { 
        valid: false, 
        error: `Valor máximo permitido: ${current.max}`,
        maxValue: current.max,
        partialValue: current.partial || 0,
      };
    }
    
    return { 
      valid: true,
      maxValue: current.max || 0,
      partialValue: current.partial || 0,
    };
  },
});

// Obter resumo de pontuação de um clube
export const getClubScoreSummary = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, args) => {
    const club = await ctx.db.get(args.clubId);
    if (!club) {
      throw new Error("Clube não encontrado");
    }

    if (!club.scores) {
      throw new Error("Clube não possui pontuações definidas");
    }
    
    const scores = club.scores;
    
    // Calcular totais por categoria
    const summary = {
      baseScore: 3050,
      prerequisites: {
        total: scores.prerequisites.photos + scores.prerequisites.directorPresence,
        max: 350,
        items: [
          { name: "Fotos SGC", value: scores.prerequisites.photos, max: 300 },
          { name: "Presença Diretor", value: scores.prerequisites.directorPresence, max: 50 },
        ],
      },
      participation: {
        total: scores.participation.opening + scores.participation.saturdayMorning + 
               scores.participation.saturdayNight + scores.participation.saturdayMeeting + 
               scores.participation.sundayMeeting,
        max: 400,
        items: [
          { name: "Abertura", value: scores.participation.opening, max: 100 },
          { name: "Sábado Manhã", value: scores.participation.saturdayMorning, max: 100 },
          { name: "Sábado Noite", value: scores.participation.saturdayNight, max: 100 },
          { name: "Reunião Sábado", value: scores.participation.saturdayMeeting, max: 50 },
          { name: "Reunião Domingo", value: scores.participation.sundayMeeting, max: 50 },
        ],
      },
      general: {
        total: scores.general.firstAidKit + scores.general.secretaryFolder + 
               scores.general.doorIdentification + scores.general.badges + scores.general.uniform,
        max: 1300,
        items: [
          { name: "Kit Primeiros Socorros", value: scores.general.firstAidKit, max: 300 },
          { name: "Pasta Secretaria", value: scores.general.secretaryFolder, max: 500 },
          { name: "Identificação Portas", value: scores.general.doorIdentification, max: 200 },
          { name: "Crachás", value: scores.general.badges, max: 200 },
          { name: "Uniforme", value: scores.general.uniform, max: 100 },
        ],
      },
      events: {
        total: scores.events.twelveHour + scores.events.carousel.abel + 
               scores.events.carousel.jacob + scores.events.carousel.samson + 
               scores.events.carousel.rahab + scores.events.carousel.gideon + 
               scores.events.carousel.barak,
        max: 700,
        items: [
          { name: "12 Horas", value: scores.events.twelveHour, max: 100 },
          { name: "Abel e Noé", value: scores.events.carousel.abel, max: 100 },
          { name: "Jacó e Davi", value: scores.events.carousel.jacob, max: 100 },
          { name: "Sansão", value: scores.events.carousel.samson, max: 100 },
          { name: "Raabe", value: scores.events.carousel.rahab, max: 100 },
          { name: "Gideão", value: scores.events.carousel.gideon, max: 100 },
          { name: "Baraque e Jefté", value: scores.events.carousel.barak, max: 100 },
        ],
      },
      bonus: {
        total: scores.bonus.pastorVisit + scores.bonus.adultVolunteer + scores.bonus.healthProfessional,
        max: 300,
        items: [
          { name: "Visita Pastor", value: scores.bonus.pastorVisit, max: 100 },
          { name: "Voluntário Adulto", value: scores.bonus.adultVolunteer, max: 100 },
          { name: "Profissional Saúde", value: scores.bonus.healthProfessional, max: 100 },
        ],
      },
      demerits: {
        total: scores.demerits.driverIssues + scores.demerits.lackReverence + 
               scores.demerits.noBadge + scores.demerits.unaccompaniedChild + 
               scores.demerits.unauthorizedVisits + scores.demerits.vandalism + 
               scores.demerits.silenceViolation + scores.demerits.disrespect,
        items: [
          { name: "Problemas Motorista", value: scores.demerits.driverIssues },
          { name: "Falta Reverência", value: scores.demerits.lackReverence },
          { name: "Sem Crachá", value: scores.demerits.noBadge },
          { name: "Criança Desacompanhada", value: scores.demerits.unaccompaniedChild },
          { name: "Visitas Não Autorizadas", value: scores.demerits.unauthorizedVisits },
          { name: "Vandalismo", value: scores.demerits.vandalism },
          { name: "Violação Silêncio", value: scores.demerits.silenceViolation },
          { name: "Desrespeito", value: scores.demerits.disrespect },
        ],
      },
      totalScore: club.totalScore,
      classification: club.classification,
    };

    return summary;
  },
});
