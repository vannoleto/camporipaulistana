import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { 
  Check, 
  Trash2, 
  X, 
  FileText, 
  BarChart3, 
  ClipboardList, 
  Users, 
  Trophy, 
  Crown, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Star,
  UserCheck,
  Building2,
  Clock,
  Lightbulb,
  Loader2,
  Package,
  Settings,
  DoorOpen,
  Info,
  History,
  RotateCcw,
  MapPin,
  Award,
  TrendingUp,
  User
} from "lucide-react";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  console.log("=== ADMINDASHBOARD START ===");
  console.log("AdminDashboard: Component is rendering", { user });
  console.log("AdminDashboard: Props received", { user, onLogout });

  // Versão simplificada para debug
  try {
    const [activeTab, setActiveTab] = useState("overview");
    const [editingCriteria, setEditingCriteria] = useState<any>(null);
    const [clubSearch, setClubSearch] = useState("");
    const [selectedClub, setSelectedClub] = useState<any>(null);
    const [editingScores, setEditingScores] = useState<any>(null);
    const [selectedRegion, setSelectedRegion] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showNewClubForm, setShowNewClubForm] = useState(false);
    const [showActivityLogs, setShowActivityLogs] = useState(false);
    const [newClubData, setNewClubData] = useState({
      name: "",
      region: "",
      membersCount: 0
    });
    const [selectedClubForPDF, setSelectedClubForPDF] = useState<string>("");
    const [generatingBatchPDF, setGeneratingBatchPDF] = useState<string>("");
    const [lockingCriteria, setLockingCriteria] = useState(false);
    const [adminEditMode, setAdminEditMode] = useState(false);
    const [rankingRegion, setRankingRegion] = useState<string>("all");
    const [showUserMenu, setShowUserMenu] = useState(false);

    console.log("AdminDashboard: About to call basic queries");

    // Começar só com queries essenciais
    console.log("AdminDashboard: Calling clubs query...");
    const clubs = useQuery(api.clubs.listClubs, { 
      region: selectedRegion === "all" ? undefined : selectedRegion 
    });
    console.log("AdminDashboard: clubs query result", { clubs, isUndefined: clubs === undefined });

    console.log("AdminDashboard: Calling users query...");
    const users = useQuery(api.users.listUsers, {});
    console.log("AdminDashboard: users query result", { users, isUndefined: users === undefined });

    console.log("AdminDashboard: Calling scoringCriteria query...");
    const scoringCriteria = useQuery(api.scoring.getScoringCriteria, {});
    console.log("AdminDashboard: scoringCriteria query result", { scoringCriteria, isUndefined: scoringCriteria === undefined });

    // Outras queries - removendo as que podem estar causando problema
    const pendingUsers = useQuery(api.users.listUsers, { approved: false });
    console.log("AdminDashboard: pendingUsers result", { pendingUsers, isUndefined: pendingUsers === undefined });

    // Removendo queries que podem não existir por enquanto
    // const classificationStats = useQuery(api.clubs.getClassificationStats, {});
    // const regionStats = useQuery(api.clubs.getRegionStats, {});
    // const ranking = useQuery(api.clubs.getRanking, { limit: 10 });
    // const activityLogs = useQuery(api.users.getActivityLogs, {});
    
    const selectedClubData = useQuery(
      api.clubs.getClubById, 
      selectedClub ? { clubId: selectedClub._id } : "skip"
    );
    // Reativando query de critérios avaliados
    const evaluatedCriteria = useQuery(
      api.evaluation.getEvaluatedCriteria,
      selectedClub ? { clubId: selectedClub._id } : "skip"
    );

    // Query para ranking
    const allClubsForRanking = useQuery(api.clubs.getRanking, {});
    
    // Calculando estatísticas dinamicamente
    const calculateRegionStats = () => {
      if (!clubs || clubs.length === 0) return {};
      
      const stats: any = {};
      
      clubs.forEach(club => {
        if (!club.region) return;
        
        if (!stats[club.region]) {
          stats[club.region] = {
            total: 0,
            totalScore: 0,
            averageScore: 0,
            classifications: {
              HEROI: 0,
              FIEL_ESCUDEIRO: 0,
              APRENDIZ: 0
            }
          };
        }
        
        stats[club.region].total++;
        stats[club.region].totalScore += club.totalScore || 0;
        
        if (club.classification) {
          stats[club.region].classifications[club.classification]++;
        } else {
          // Se não tem classificação, assume APRENDIZ
          stats[club.region].classifications.APRENDIZ++;
        }
      });
      
      // Calcular média de pontuação para cada região
      Object.keys(stats).forEach(region => {
        if (stats[region].total > 0) {
          stats[region].averageScore = Math.round(stats[region].totalScore / stats[region].total);
        }
      });
      
      return stats;
    };

    const calculateClassificationStats = () => {
      if (!clubs || clubs.length === 0) return { HEROI: 0, FIEL_ESCUDEIRO: 0, APRENDIZ: 0 };
      
      const stats = { HEROI: 0, FIEL_ESCUDEIRO: 0, APRENDIZ: 0 };
      
      clubs.forEach(club => {
        if (club.classification) {
          stats[club.classification as keyof typeof stats]++;
        } else {
          stats.APRENDIZ++;
        }
      });
      
      return stats;
    };

    // Estatísticas calculadas dinamicamente
    const regionStats = calculateRegionStats();
    const classificationStats = calculateClassificationStats();
    const activityLogs: any[] = [];

    console.log("AdminDashboard: All queries called, checking loading state...");

    // Mutations
    const approveUser = useMutation(api.users.approveUser);
    const updateUser = useMutation(api.users.updateUser);
    const deleteUser = useMutation(api.users.deleteUser);
    const initializeClubs = useMutation(api.clubs.initializeClubs);
    const resetClubsToMaxScore = useMutation(api.clubs.resetAllClubScores);
    const updateScoringCriteria = useMutation(api.scoring.updateScoringCriteria);
    const resetScoringCriteria = useMutation(api.scoring.resetScoringCriteria);
    const fixClubScores = useMutation(api.clubs.fixClubScores);
    const reclassifyAllClubs = useMutation(api.classification.reclassifyAllClubs);
    const validateAllClassifications = useMutation(api.classification.validateAllClassifications);
    const fixInitialClassifications = useMutation(api.classification.fixInitialClassifications);
    const updateClubScores = useMutation(api.clubs.updateClubScores);
    // Reativando mutations de travamento
    const lockCriteria = useMutation(api.evaluation.lockCriteria);
    const unlockCriteria = useMutation(api.evaluation.unlockCriteria);
    const clearAllCriteriaLocks = useMutation(api.evaluation.clearAllCriteriaLocks);
    const clearAllActivityLogs = useMutation(api.clubs.clearAllActivityLogs);
    const deleteClub = useMutation(api.clubs.deleteClub);
    const createClub = useMutation(api.clubs.createClub);

  // Função para calcular pontuação total baseada na estrutura de pontuações
  const calculateTotalScore = (scores: any) => {
    if (!scores) return 0;

    let totalScore = 0;

    // Somar pontuações de cada categoria
    if (scores.prerequisites) {
      Object.values(scores.prerequisites).forEach((value: any) => {
        totalScore += Math.abs(value || 0);
      });
    }

    if (scores.participation) {
      Object.values(scores.participation).forEach((value: any) => {
        totalScore += Math.abs(value || 0);
      });
    }

    if (scores.general) {
      Object.values(scores.general).forEach((value: any) => {
        totalScore += Math.abs(value || 0);
      });
    }

    if (scores.events) {
      Object.entries(scores.events).forEach(([key, value]: [string, any]) => {
        if (key === 'carousel') {
          Object.values(value).forEach((carouselValue: any) => {
            totalScore += Math.abs(carouselValue || 0);
          });
        } else {
          totalScore += Math.abs(value || 0);
        }
      });
    }

    if (scores.bonus) {
      Object.values(scores.bonus).forEach((value: any) => {
        totalScore += Math.abs(value || 0);
      });
    }

    // Deméritos são subtraídos (valores positivos representam penalidades)
    if (scores.demerits) {
      Object.values(scores.demerits).forEach((value: any) => {
        totalScore -= (value || 0);
      });
    }

    return Math.max(0, totalScore);
  };

  const getClassification = (totalScore: number): string => {
    if (totalScore >= 2300) return "HEROI";
    if (totalScore >= 1100) return "FIEL_ESCUDEIRO";
    return "APRENDIZ";
  };



  const updateScore = (category: string, subcategory: string, value: any) => {
    const actualValue = typeof value === 'string' ? parseInt(value) : value;
    // Validar que pontuações não podem ser negativas (exceto para deméritos que são valores positivos representando penalidades)
    if (actualValue < 0 && category !== "demerits") {
      toast.error("Pontuações não podem ser negativas");
      return;
    }

    // Buscar valor máximo permitido (incluindo parcial)
    if (scoringCriteria) {
      let maxValue = 0;
      let itemData = null;
      
      if (subcategory.includes('.')) {
        const [subcat, item] = subcategory.split('.');
        itemData = scoringCriteria[category]?.[subcat]?.[item];
      } else {
        itemData = scoringCriteria[category]?.[subcategory];
      }
      
      if (itemData) {
        maxValue = itemData.max;
      }
      
      if (value > maxValue) {
        toast.error(`Pontuação não pode exceder ${maxValue} pontos`);
        return;
      }
    }

    const newScores = { ...editingScores };
    
    if (subcategory.includes('.')) {
      const [subcat, item] = subcategory.split('.');
      newScores[category][subcat][item] = actualValue;
    } else {
      newScores[category][subcategory] = actualValue;
    }
    
    setEditingScores(newScores);
  };

  // Nova função para travar apenas um critério específico
  const lockSingleCriteria = async (category: string, criteriaKey: string, subKey?: string) => {
    if (!selectedClub || lockingCriteria || !editingScores) return;

    // Obter o score atual do critério
    let score: number;
    if (subKey) {
      // Para subitens como carousel
      score = editingScores[category]?.[criteriaKey]?.[subKey] || 0;
    } else {
      // Para itens normais
      score = editingScores[category]?.[criteriaKey] || 0;
    }

    if (score <= 0) {
      toast.warning("Não é possível travar um critério sem pontuação.");
      return;
    }

    setLockingCriteria(true);
    try {
      console.log("AdminDashboard: Locking single criteria", {
        category,
        criteriaKey,
        subKey,
        score,
        clubId: selectedClub._id
      });

      await lockCriteria({
        clubId: selectedClub._id as any,
        category: category,
        criteriaKey: criteriaKey,
        subKey,
        score: score,
        evaluatedBy: user._id,
      });

      console.log("AdminDashboard: Single criteria locked successfully", {
        criteriaKey: subKey 
          ? `${category}.${criteriaKey}.${subKey}`
          : `${category}.${criteriaKey}`,
        subKey: subKey,
        score: score
      });

      toast.success("Critério travado com sucesso!");
    } catch (error: any) {
      console.error("AdminDashboard: Error locking single criteria:", error);
      toast.error(error.message);
    } finally {
      setLockingCriteria(false);
    }
  };

  // Função para ativar modo de edição do admin (destrava tudo temporariamente)
  const enableAdminEditMode = async () => {
    if (!selectedClub) return;
    
    try {
      console.log("AdminDashboard: Enabling admin edit mode for club", selectedClub._id);
      
      // Desbloquear todos os critérios travados para este clube
      await clearAllCriteriaLocks({
        clubId: selectedClub._id,
        adminId: user._id,
      });
      
      setAdminEditMode(true);
      toast.success("Modo de edição ativado - Todos os critérios foram destravados temporariamente!");
    } catch (error: any) {
      console.error("AdminDashboard: Error enabling admin edit mode:", error);
      toast.error(error.message);
    }
  };

  // Função para salvar e re-travar apenas critérios modificados após edição do admin
  const saveAdminChanges = async () => {
    if (!selectedClub || !editingScores) return;
    
    try {
      console.log("AdminDashboard: Saving admin changes and locking only modified criteria");
      
      // Salvar as pontuações
      await updateClubScores({
        clubId: selectedClub._id,
        scores: editingScores,
        userId: user._id,
      });

      // Travar apenas os critérios que foram realmente modificados pelo admin
      await lockModifiedCriteria(selectedClub._id, editingScores);
      
      setAdminEditMode(false);
      setEditingScores(null);
      setSelectedClub(null);
      setActiveTab("clubs");
      
      toast.success("Pontuações salvas e apenas critérios modificados foram travados!");
    } catch (error: any) {
      console.error("AdminDashboard: Error saving admin changes:", error);
      toast.error(error.message);
    }
  };

  // Função auxiliar para re-travar todos os critérios modificados
  const lockAllModifiedCriteria = async (clubId: string, scores: any) => {
    const lockPromises: Promise<any>[] = [];

    const lockCategory = (category: string, categoryScores: any, parentKey?: string) => {
      for (const [key, value] of Object.entries(categoryScores)) {
        if (typeof value === 'object' && value !== null) {
          // Para objetos aninhados como carousel
          lockCategory(category, value, key);
          continue;
        }
        
        // Se tem pontuação > 0, travar
        if (typeof value === 'number' && value > 0) {
          lockPromises.push(
            lockCriteria({
              clubId: clubId as any,
              category: category,
              criteriaKey: parentKey || key,
              subKey: parentKey ? key : undefined,
              score: value as number,
              evaluatedBy: user._id,
            })
          );
        }
      }
    };

    // Travar todas as categorias (exceto deméritos)
    if (scores.prerequisites) lockCategory("prerequisites", scores.prerequisites);
    if (scores.participation) lockCategory("participation", scores.participation);
    if (scores.general) lockCategory("general", scores.general);
    if (scores.events) lockCategory("events", scores.events);
    if (scores.bonus) lockCategory("bonus", scores.bonus);

    await Promise.all(lockPromises);
  };

  const startEvaluation = (club: any) => {
    console.log("AdminDashboard: startEvaluation called", { club });
    setSelectedClub(club);
    // Mudar para a aba de avaliação
    setActiveTab("evaluation");
    // Inicializar com pontuações existentes ou estrutura padrão
    const currentScores = club.scores || {
      prerequisites: { photos: 0, directorPresence: 0 },
      participation: { opening: 0, saturdayMorning: 0, saturdayNight: 0, saturdayMeeting: 0, sundayMeeting: 0 },
      general: { firstAidKit: 0, secretaryFolder: 0, doorIdentification: 0, badges: 0, uniform: 0 },
      events: { 
        twelveHour: 0, 
        carousel: { abel: 0, jacob: 0, samson: 0, rahab: 0, gideon: 0, barak: 0 }
      },
      bonus: { pastorVisit: 0, adultVolunteer: 0, healthProfessional: 0 },
      demerits: { 
        driverIssues: 0, lackReverence: 0, noBadge: 0, unaccompaniedChild: 0, 
        unauthorizedVisits: 0, vandalism: 0, silenceViolation: 0, disrespect: 0 
      }
    };
    console.log("AdminDashboard: Setting editingScores", { currentScores });
    setEditingScores({ ...currentScores });
    console.log("AdminDashboard: startEvaluation completed");
  };

  const handleApproveUser = async (userId: string, approved: boolean) => {
    try {
      await approveUser({ userId: userId as any, approved, adminId: user._id });
      toast.success(`Usuário ${approved ? "aprovado" : "rejeitado"} com sucesso!`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleResetClubsToMaxScore = async () => {
    try {
      // Reset das pontuações
      const result = await resetClubsToMaxScore({});
      
      // Limpar todos os travamentos
      await clearAllCriteriaLocks({
        adminId: user._id,
      });
      
      // Limpar todo o histórico de atividades
      const historyResult = await clearAllActivityLogs({
        adminId: user._id,
      });
      
      toast.success(`${result} - Travamentos e histórico foram limpos. ${historyResult.count} registros de histórico removidos.`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleShowActivityLogs = () => {
    setShowActivityLogs(!showActivityLogs);
  };

  const handleSaveScores = async () => {
    if (!selectedClub || !editingScores) return;
    
    try {
      // Atualizar pontuações do clube
      await updateClubScores({
        clubId: selectedClub._id,
        scores: editingScores,
        userId: user._id,
      });

      // Marcar apenas os critérios que foram realmente modificados
      await lockModifiedCriteria(selectedClub._id, editingScores);
      
      toast.success("Pontuações salvas com sucesso!");
      setEditingScores(null);
      setSelectedClub(null); // Volta para a lista de clubes
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const lockModifiedCriteria = async (clubId: string, newScores: any) => {
    if (!selectedClubData?.scores) return;
    
    const originalScores = selectedClubData.scores;
    const lockPromises: Promise<any>[] = [];

    // Comparar e travar apenas critérios modificados
    const compareAndLock = (category: string, originalCat: any, newCat: any, parentKey?: string) => {
      for (const [key, newValue] of Object.entries(newCat)) {
        const originalValue = originalCat[key];
        
        // Para objetos aninhados como carousel
        if (typeof newValue === 'object' && newValue !== null) {
          compareAndLock(category, originalValue || {}, newValue, key);
          continue;
        }
        
        // Se o valor foi modificado, travar o critério
        if (originalValue !== newValue) {
          console.log("AdminDashboard: Locking criteria", {
            category,
            criteriaKey: parentKey || key,
            subKey: parentKey ? key : undefined,
            originalValue,
            newValue,
            clubId
          });
          
          lockPromises.push(
            lockCriteria({
              clubId: clubId as any,
              category: category,
              criteriaKey: parentKey || key,
              subKey: parentKey ? key : undefined,
              score: newValue as number,
              evaluatedBy: user._id,
            })
          );
        }
      }
    };

    // Verificar cada categoria (DEMÉRITOS são excluídos do travamento pois podem ocorrer múltiplas vezes)
    compareAndLock("prerequisites", originalScores.prerequisites, newScores.prerequisites);
    compareAndLock("participation", originalScores.participation, newScores.participation);
    compareAndLock("general", originalScores.general, newScores.general);
    compareAndLock("events", originalScores.events, newScores.events);
    compareAndLock("bonus", originalScores.bonus, newScores.bonus);
    // ❌ DEMÉRITOS NÃO SÃO TRAVADOS - podem ocorrer múltiplas vezes durante o evento
    // compareAndLock("demerits", originalScores.demerits, newScores.demerits);

    await Promise.all(lockPromises);
  };

  const isCriteriaEvaluated = (category: string, key: string, subKey?: string): boolean => {
    // DEMÉRITOS nunca são travados - podem ocorrer múltiplas vezes durante o evento
    if (category === "demerits") return false;
    
    // Se admin está em modo de edição, nada está travado temporariamente
    if (adminEditMode) return false;
    
    if (!evaluatedCriteria) {
      console.log("AdminDashboard: evaluatedCriteria is null/undefined");
      return false;
    }
    
    const criteriaKey = subKey 
      ? `${category}.${key}.${subKey}`
      : `${category}.${key}`;
    
    const isLocked = evaluatedCriteria[criteriaKey]?.isLocked || false;
    
    console.log("AdminDashboard: isCriteriaEvaluated check", {
      category,
      key,
      subKey,
      criteriaKey,
      isLocked,
      criteriaData: evaluatedCriteria[criteriaKey],
      allCriteria: evaluatedCriteria
    });
    
    return isLocked;
  };

  const handleUpdateCriteria = async () => {
    if (!editingCriteria) return;
    
    try {
      await updateScoringCriteria({
        criteria: editingCriteria,
        adminId: user._id,
      });
      toast.success("Critérios atualizados com sucesso!");
      setEditingCriteria(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleResetCriteria = async () => {
    try {
      await resetScoringCriteria({ adminId: user._id });
      toast.success("Critérios resetados para padrão!");
      setEditingCriteria(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFixClubScores = async () => {
    try {
      const result = await fixClubScores({ adminId: user._id });
      toast.success(result);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReclassifyAllClubs = async () => {
    try {
      const result = await reclassifyAllClubs({ adminId: user._id });
      toast.success(result);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleValidateClassifications = async () => {
    try {
      const result = await validateAllClassifications({ adminId: user._id });
      toast.success(result.message);
      
      if (result.inconsistenciesFound > 0) {
        console.log("Inconsistências encontradas:", result.inconsistencies);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFixInitialClassifications = async () => {
    try {
      const result = await fixInitialClassifications({ adminId: user._id });
      toast.success(result);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o clube "${clubName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const result = await deleteClub({ clubId: clubId as any, adminId: user._id });
      toast.success(result);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCreateClub = async () => {
    if (!newClubData.name.trim()) {
      toast.error("Nome do clube é obrigatório");
      return;
    }
    if (!newClubData.region) {
      toast.error("Região é obrigatória");
      return;
    }
    if (newClubData.membersCount < 0) {
      toast.error("Número de inscritos não pode ser negativo");
      return;
    }

    try {
      const result = await createClub({
        name: newClubData.name.trim(),
        region: newClubData.region,
        membersCount: newClubData.membersCount,
        adminId: user._id,
      });
      toast.success(result);
      setShowNewClubForm(false);
      setNewClubData({ name: "", region: "", membersCount: 0 });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const generateSinglePDF = (club: any) => {
    if (!scoringCriteria) {
      toast.error("Critérios de pontuação não carregados");
      return null;
    }

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 10;
      let y = 12;

      // Cabeçalho
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("FICHA DE AVALIAÇÃO - XXVII AVENTURI 2025", pageWidth / 2, y, { align: "center" });
      y += 8;

      // Dados do clube
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Clube: ${club.name}`, margin, y);
      pdf.text(`Região: ${club.region}`, pageWidth / 2, y);
      pdf.text(`Inscritos: ${club.membersCount || 0}`, pageWidth - 40, y);
      y += 4;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;

      const lineHeight = 3.5;
      const sectionSpacing = 2;

      // Função auxiliar
      const addSection = (title: string, items: string[]) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(title, margin, y);
        y += 4;
        pdf.setFont("helvetica", "normal");
        items.forEach(item => {
          pdf.text(item, margin + 4, y);
          pdf.text("_____", pageWidth - 25, y);
          y += lineHeight;
        });
        y += sectionSpacing;
      };

      // Seções
      addSection("PRÉ-REQUISITOS", [
        "□ Fotos SGC – 300 (150 parcial)",
        "□ Reunião prévia – 50"
      ]);

      addSection("PARTICIPAÇÃO", [
        "□ Abertura – 100 (30 parcial)",
        "□ Sábado manhã – 100 (30)",
        "□ Sábado noite – 100 (30)",
        "□ Reunião sábado – 50",
        "□ Reunião domingo – 50"
      ]);

      addSection("CRITÉRIOS GERAIS", [
        "□ Maleta 1ºs socorros – 300 (150)",
        "□ Pasta secretaria – 500 (250)",
        "□ Portas identificadas – 200",
        "□ Crachá membros – 200",
        "□ Uniforme gala sábado manhã – 100 (50)"
      ]);

      addSection("EVENTOS", [
        "□ 1 aventureiro no 12h – 100",
        "□ Oferta na Arca – 100",
        "□ Gigantes e Nações – 100",
        "□ Força da Verdade – 100",
        "□ Caminho até o Céu – 100",
        "□ Exército Colaborador – 100",
        "□ Olhos da Fé – 100"
      ]);

      addSection("BÔNUS", [
        "□ Visita pastor distrital – 100",
        "□ Adulto escala plantão – 100",
        "□ Profissional saúde plantão – 100"
      ]);

      addSection("DEMÉRITOS", [
        "□ Motorista indevido – -150",
        "□ Sem reverência culto – -30",
        "□ Sem crachá – -20 p/ membro",
        "□ Aventureiro desacomp. – -50",
        "□ Visita fora período – -150",
        "□ Depredação – -50",
        "□ Silêncio desrespeitado – -50",
        "□ Desrespeito autoridade – -50"
      ]);

      // Resumo
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("RESUMO FINAL", margin, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.text("TOTAL GERAL: _________ pts", margin + 10, y);
      y += 5;
      pdf.text("CLASSIFICAÇÃO:", margin + 10, y);
      y += 4;
      pdf.setFontSize(7);
      pdf.text("□ HERÓI (≥2300)   □ FIEL ESCUDEIRO (1100-2299)   □ APRENDIZ (<1100)", margin + 12, y);

      // Rodapé
      y = pdf.internal.pageSize.height - 15;
      pdf.setFontSize(7);
      pdf.text("Avaliador: ____________________   Data: ___/___/2025   Assinatura: ____________________", margin, y);

      return pdf;
    } catch (error: any) {
      toast.error("Erro ao gerar PDF: " + error.message);
      return null;
    }
  };

  const generatePDF = () => {
    if (!selectedClubForPDF) {
      toast.error("Selecione um clube para gerar o PDF");
      return;
    }

    const selectedClub = clubs?.find(club => club._id === selectedClubForPDF);
    if (!selectedClub) {
      toast.error("Clube não encontrado");
      return;
    }

    const pdf = generateSinglePDF(selectedClub);
    if (pdf) {
      const fileName = `Avaliacao_${selectedClub.name.replace(/\s+/g, '_')}_${selectedClub.region}.pdf`;
      pdf.save(fileName);
      toast.success("PDF gerado com sucesso!");
    }
  };

  const generateBatchPDFByRegion = async (region: string) => {
    if (!clubs || !scoringCriteria) {
      toast.error("Dados não carregados");
      return;
    }

    setGeneratingBatchPDF(region);

    try {
      const regionClubs = clubs.filter(club => club.region === region);
      
      if (regionClubs.length === 0) {
        toast.error(`Nenhum clube encontrado na ${region}`);
        setGeneratingBatchPDF("");
        return;
      }

      let successCount = 0;
      
      // Gerar PDFs individuais para cada clube da região
      for (const club of regionClubs) {
        const pdf = generateSinglePDF(club);
        if (pdf) {
          successCount++;

        
        // Salvar cada PDF individualmente
        const fileName = `Avaliacao_${club.name.replace(/\s+/g, '_')}_${club.region}.pdf`;
        pdf.save(fileName);
        
        // Pequena pausa entre downloads
        await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} PDFs gerados para a ${region}!`);
      } else {
        toast.error("Erro ao gerar PDFs");
      }
      
    } catch (error: any) {
      toast.error("Erro ao gerar PDFs em lote: " + error.message);
    } finally {
      setGeneratingBatchPDF("");
    }
  };

  // Filter clubs based on search
  const filteredClubs = clubs?.filter(club => {
    if (!clubSearch && !searchTerm) return true;
    
    const searchLower = (clubSearch || searchTerm).toLowerCase();
    return (
      club.name.toLowerCase().includes(searchLower) ||
      club.region.toLowerCase().includes(searchLower) ||
      club.classification?.toLowerCase().includes(searchLower)
    );
  });

  const tabs = [
    { id: "overview", name: "Visão Geral", icon: <BarChart3 size={20} /> },
    { id: "evaluation", name: "Avaliação", icon: <ClipboardList size={20} /> },
    { id: "clubs", name: "Clubes", icon: <FileText size={20} /> },
    { id: "users", name: "Usuários", icon: <Users size={20} /> },
    { id: "pending", name: "Aprovações", icon: <Search size={20} /> },
    { id: "ranking", name: "Ranking", icon: <Trophy size={20} /> },
    { id: "scoring", name: "Pontuação", icon: <ClipboardList size={20} /> },
    { id: "pdf", name: "Gerar PDF", icon: <FileText size={20} /> },
    { id: "system", name: "Sistema", icon: <Settings size={20} /> },
  ];

  const renderClubSelection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center">
          <Info size={20} className="text-blue-600 mr-2" />
          <div className="text-blue-800">
            <p className="font-medium">Sistema de Pontuação do Evento</p>
            <p className="text-sm">
              Todos os clubes iniciam com pontuação zero. Durante o evento, os pontos são atribuídos conforme os critérios são atendidos.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar clube por nome ou região..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as Regiões</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={`R${i + 1}`}>Região {i + 1}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClubs?.map((club) => (
          <div
            key={club._id}
            className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => startEvaluation(club)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 truncate">{club.name}</h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {club.region}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pontuação:</span>
                <span className="font-medium text-blue-600">
                  {club.totalScore ? club.totalScore.toLocaleString() : '0'} pts
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Classificação:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  club.classification === "HEROI" 
                    ? "bg-purple-100 text-purple-800"
                    : club.classification === "FIEL_ESCUDEIRO"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {club.classification === "HEROI" ? (
                    <span className="flex items-center gap-1">
                      <Crown size={12} />
                      HERÓI
                    </span>
                  ) : club.classification === "FIEL_ESCUDEIRO" ? (
                    <span className="flex items-center gap-1">
                      <Trophy size={12} />
                      FIEL ESCUDEIRO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Target size={12} />
                      APRENDIZ
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-sm">
                Avaliar Clube
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClubs?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search size={64} />
          </div>
          <p className="text-gray-600">Nenhum clube encontrado com os filtros aplicados.</p>
        </div>
      )}
    </div>
  );

  const renderEvaluationForm = () => {
    console.log("AdminDashboard: renderEvaluationForm called", {
      selectedClub: !!selectedClub,
      scoringCriteria: !!scoringCriteria,
      editingScores: !!editingScores,
      selectedClubData: selectedClub,
      criteriaData: scoringCriteria
    });
    
    if (!selectedClub || !editingScores) {
      console.log("AdminDashboard: renderEvaluationForm returning null - missing selectedClub or editingScores");
      return null;
    }

    // Usar dados padrão se scoringCriteria não estiver disponível
    const defaultCriteria = {
      prerequisites: {
        photos: { max: 300, description: "Fotos do clube" },
        directorPresence: { max: 50, description: "Presença do diretor" }
      },
      participation: {
        opening: { max: 100, description: "Abertura" },
        saturdayMorning: { max: 100, description: "Sábado manhã" },
        saturdayNight: { max: 100, description: "Sábado noite" },
        saturdayMeeting: { max: 50, description: "Reunião sábado" },
        sundayMeeting: { max: 50, description: "Reunião domingo" }
      },
      general: {
        firstAidKit: { max: 300, description: "Kit primeiros socorros" },
        secretaryFolder: { max: 500, description: "Pasta secretário" },
        doorIdentification: { max: 200, description: "Identificação da porta" },
        badges: { max: 200, description: "Distintivos" },
        uniform: { max: 100, description: "Uniforme" }
      },
      events: {
        twelveHour: { max: 100, description: "12 horas" },
        carousel: {
          abel: { max: 100, description: "Abel" },
          jacob: { max: 100, description: "Jacó" },
          samson: { max: 100, description: "Sansão" },
          rahab: { max: 100, description: "Raabe" },
          gideon: { max: 100, description: "Gideão" },
          barak: { max: 100, description: "Baraque" }
        }
      },
      bonus: {
        pastorVisit: { max: 100, description: "Visita do pastor" },
        adultVolunteer: { max: 100, description: "Voluntário adulto" },
        healthProfessional: { max: 100, description: "Profissional da saúde" }
      },
      demerits: {
        driverIssues: { max: -50, description: "Problemas com motorista" },
        lackReverence: { max: -30, description: "Falta de reverência" },
        noBadge: { max: -20, description: "Sem distintivo" },
        unaccompaniedChild: { max: -30, description: "Criança desacompanhada" },
        unauthorizedVisits: { max: -40, description: "Visitas não autorizadas" },
        vandalism: { max: -100, description: "Vandalismo" },
        silenceViolation: { max: -20, description: "Violação do silêncio" },
        disrespect: { max: -50, description: "Desrespeito" }
      }
    };

    const criteriaToUse = scoringCriteria || defaultCriteria;

    const currentScores = editingScores;
    const totalScore = calculateTotalScore(currentScores);
    const classification = getClassification(totalScore);

    const renderScoreSection = (title: any, category: string, data: any, scores: any, isDemerits = false) => (
      <div className={`p-6 rounded-xl shadow-sm ${isDemerits ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          {title}
          {isDemerits && <AlertTriangle size={16} className="ml-2 text-red-500" />}
        </h3>
        <div className="space-y-4">
          {Object.entries(data).map(([key, item]: [string, any]) => {
            if (key === 'carousel') {
              return (
                <div key={key} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-medium mb-2">Carrossel de Atividades</h4>
                  <div className="space-y-3">
                    {Object.entries(item).map(([carouselKey, carouselItem]: [string, any]) => {
                      const isCarouselLocked = isCriteriaEvaluated(category, key, carouselKey);
                      
                      return (
                        <div key={carouselKey} className={`flex items-center justify-between p-3 rounded-lg ${
                          isCarouselLocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">{carouselItem.description}</div>
                              {isCarouselLocked && (
                                <div title="Critério avaliado e travado">
                                  <CheckCircle size={16} className="text-green-600" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Pontuação máxima: {carouselItem.max} pts
                              {carouselItem.partial !== undefined && ` | Parcial: ${carouselItem.partial} pts`}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={scores.carousel[carouselKey]}
                              onChange={(e) => updateScore(category, `carousel.${carouselKey}`, parseInt(e.target.value))}
                              className={`px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 ${
                                isCarouselLocked ? 'bg-green-100 cursor-not-allowed' : ''
                              }`}
                              disabled={isCarouselLocked}
                            >
                              <option value={0}>0 pts</option>
                              {carouselItem.partial !== undefined && (
                                <option value={carouselItem.partial}>{carouselItem.partial} pts (parcial)</option>
                              )}
                              <option value={carouselItem.max}>{carouselItem.max} pts (máximo)</option>
                            </select>
                            {!isCarouselLocked && scores.carousel[carouselKey] > 0 && (
                              <button
                                onClick={() => lockSingleCriteria(category, "carousel", carouselKey)}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                disabled={lockingCriteria}
                                title="Travar este critério"
                              >
                                Travar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const currentValue = scores[key];
            const isLocked = isCriteriaEvaluated(category, key);
            
            return (
              <div key={key} className={`flex items-center justify-between p-3 rounded-lg ${
                isLocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{item.description}</div>
                    {isLocked && (
                      <div title="Critério avaliado e travado">
                        <CheckCircle size={16} className="text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isDemerits ? (
                      `Penalidade: ${item.penalty} pts por ocorrência`
                    ) : (
                      `Pontuação disponível: ${item.max} pts${item.partial !== undefined ? ` | Parcial: ${item.partial} pts` : ''}`
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isDemerits ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Ocorrências:</span>
                      <input
                        type="number"
                        value={Math.abs(Math.floor(currentValue / item.penalty)) || 0}
                        onChange={(e) => {
                          const occurrences = parseInt(e.target.value) || 0;
                          updateScore(category, key, Math.abs(occurrences * item.penalty));
                        }}
                        className={`w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500 ${
                          isLocked ? 'bg-green-100 cursor-not-allowed' : ''
                        }`}
                        min={0}
                        placeholder="0"
                        disabled={isLocked}
                      />
                      <span className="text-sm font-medium text-red-600">
                        ➝ Total: -{currentValue ? currentValue.toLocaleString() : 0} pts
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <select
                        value={currentValue}
                        onChange={(e) => updateScore(category, key, parseInt(e.target.value))}
                        className={`px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 ${
                          isLocked ? 'bg-green-100 cursor-not-allowed' : ''
                        }`}
                        disabled={isLocked}
                      >
                        <option value={0}>0 pts</option>
                        {item.partial !== undefined && (
                          <option value={item.partial}>{item.partial} pts (parcial)</option>
                        )}
                        <option value={item.max}>{item.max} pts (máximo)</option>
                      </select>
                      {!isLocked && currentValue > 0 && (
                        <button
                          onClick={() => lockSingleCriteria(category, key)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          disabled={lockingCriteria}
                          title="Travar este critério"
                        >
                          Travar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Header da Avaliação */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedClub.name}</h2>
              <p className="text-gray-600">Região: {selectedClub.region}</p>
              {adminEditMode && (
                <div className="mt-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium inline-block">
                  🔓 Modo de Edição Ativo - Todos os critérios destravados
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedClub(null);
                setEditingScores(null);
                setAdminEditMode(false);
                setActiveTab("clubs");
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Fechar
            </button>
          </div>

          {/* Pontuação Atual */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pontuação Atual</h3>
                <p className="text-blue-100">
                  Inscritos: {selectedClub?.membersCount || 0} Membros
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {totalScore.toLocaleString()} pts
                </div>
                <div className="text-lg flex items-center gap-2 mt-2">
                  {classification === "HEROI" ? (
                    <>
                      <Crown size={20} className="text-yellow-500" />
                      HERÓI
                    </>
                  ) : classification === "FIEL_ESCUDEIRO" ? (
                    <>
                      <Trophy size={20} className="text-blue-500" />
                      FIEL ESCUDEIRO
                    </>
                  ) : (
                    <>
                      <Target size={20} className="text-green-500" />
                      APRENDIZ
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso sobre presença */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center">
            <Users size={16} className="text-blue-600 mr-2" />
            <div className="text-blue-800">
              <p className="font-medium">Controle de Presença</p>
              <p className="text-sm">
                Alguns critérios exigem 100% de presença dos membros inscritos ({selectedClub?.membersCount || 0} membros). Verifique se todos estão presentes antes de avaliar.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setSelectedClub(null);
              setEditingScores(null);
              setAdminEditMode(false);
              setActiveTab("clubs");
            }}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          {!adminEditMode ? (
            <button
              onClick={enableAdminEditMode}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              title="Destravar todos os critérios para edição (somente Admin)"
            >
              <Settings size={16} />
              Editar Pontuação
            </button>
          ) : (
            <button
              onClick={saveAdminChanges}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              title="Salvar alterações e re-travar todos os critérios"
            >
              <CheckCircle size={16} />
              Salvar Edição
            </button>
          )}
          <button
            onClick={handleSaveScores}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            style={{ display: adminEditMode ? 'none' : 'block' }}
          >
            Salvar Pontuações
          </button>
        </div>

        {/* Seções de Pontuações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <ClipboardList size={20} />
              Pré-requisitos
            </span>, 
            "prerequisites", criteriaToUse.prerequisites, currentScores.prerequisites
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Users size={20} />
              Participação
            </span>, 
            "participation", criteriaToUse.participation, currentScores.participation
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Target size={20} />
              Critérios Gerais
            </span>, 
            "general", criteriaToUse.general, currentScores.general
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Star size={20} />
              Eventos
            </span>, 
            "events", criteriaToUse.events, currentScores.events
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Trophy size={20} />
              Bônus
            </span>, 
            "bonus", criteriaToUse.bonus, currentScores.bonus
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-red-700">Deméritos</span>
            </span>, 
            "demerits", criteriaToUse.demerits, currentScores.demerits, true
          )}
        </div>
        
        {/* Aviso sobre deméritos */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle size={16} className="text-red-600 mr-2" />
            <div className="text-red-800">
              <p className="font-medium">Atenção - Deméritos</p>
              <p className="text-sm">
                Os pontos dos deméritos são <strong>subtraídos</strong> da pontuação total do clube. Digite o número de ocorrências e o sistema calculará automaticamente a penalidade.
              </p>
              <p className="text-sm mt-1">
                <strong>Importante:</strong> Deméritos podem ser aplicados <strong>múltiplas vezes</strong> durante o evento (ex: vários membros sem crachá).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEvaluation = () => {
    return selectedClub ? renderEvaluationForm() : (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center">
            <Info size={20} className="text-blue-600 mr-2" />
            <div className="text-blue-800">
              <p className="font-medium">Sistema de Avaliação - Admin</p>
              <p className="text-sm">
                Selecione um clube para iniciar ou continuar sua avaliação. Como administrador, você pode avaliar todos os clubes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar clube por nome ou região..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Regiões</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={`R${i + 1}`}>Região {i + 1}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs?.map((club) => (
            <div
              key={club._id}
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => startEvaluation(club)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate">{club.name}</h3>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {club.region}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pontuação:</span>
                  <span className="font-medium text-gray-900">
                    {club.totalScore?.toLocaleString() || 0} pts
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Classificação:</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    club.classification === "HEROI" 
                      ? "bg-purple-100 text-purple-800"
                      : club.classification === "FIEL_ESCUDEIRO"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {club.classification === "HEROI" ? "HERÓI" : 
                     club.classification === "FIEL_ESCUDEIRO" ? "FIEL ESCUDEIRO" : "APRENDIZ"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Membros:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {club.membersCount || 'Não informado'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEvaluation(club);
                  }}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Avaliar Clube
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total de Clubes</p>
              <p className="text-2xl font-bold text-blue-900">{clubs?.length || 0}</p>
            </div>
            <div className="text-blue-500">
              <Building2 size={32} />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Usuários Ativos</p>
              <p className="text-2xl font-bold text-green-900">
                {users?.filter(u => u.isActive && u.isApproved).length || 0}
              </p>
            </div>
            <div className="text-green-500">
              <Users size={32} />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Aguardando Aprovação</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingUsers?.length || 0}</p>
            </div>
            <div className="text-yellow-500">
              <Clock size={32} />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Clubes Herói</p>
              <p className="text-2xl font-bold text-purple-900">
                {classificationStats?.HEROI || 0}
              </p>
            </div>
            <div className="text-purple-500">
              <Crown size={32} />
            </div>
          </div>
        </div>
      </div>

      {classificationStats && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Classificação</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="mb-2 text-purple-600">
                <Crown size={32} className="mx-auto" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{classificationStats.HEROI}</div>
              <div className="text-sm text-gray-600">HERÓI</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-blue-600">
                <Trophy size={32} className="mx-auto" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{classificationStats.FIEL_ESCUDEIRO}</div>
              <div className="text-sm text-gray-600">FIEL ESCUDEIRO</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-green-600">
                <Target size={32} className="mx-auto" />
              </div>
              <div className="text-2xl font-bold text-green-600">{classificationStats.APRENDIZ}</div>
              <div className="text-sm text-gray-600">APRENDIZ</div>
            </div>
          </div>
        </div>
      )}

      {regionStats && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Dashboard Detalhado por Região</h3>
            
            {/* Resumo Geral das Regiões */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total de Regiões</p>
                    <p className="text-2xl font-bold text-blue-900">{Object.keys(regionStats).length}</p>
                  </div>
                  <MapPin size={24} className="text-blue-600" />
                </div>
              </div>
              
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Região com Mais Clubes</p>
                    <p className="text-2xl font-bold text-green-900">
                      {Object.keys(regionStats).length > 0 
                        ? Object.entries(regionStats).reduce((max, [region, stats]: [string, any]) => 
                            stats.total > (regionStats[max] ? regionStats[max].total : 0) ? region : max, Object.keys(regionStats)[0]
                          )
                        : '--'
                      }
                    </p>
                    <p className="text-xs text-green-600">
                      {Object.keys(regionStats).length > 0 
                        ? Math.max(...Object.values(regionStats).map((s: any) => s.total))
                        : 0
                      } clubes
                    </p>
                  </div>
                  <Trophy size={24} className="text-green-600" />
                </div>
              </div>              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Maior Pontuação Média</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {Object.keys(regionStats).length > 0 
                        ? Object.entries(regionStats).reduce((max, [region, stats]: [string, any]) => 
                            stats.averageScore > (regionStats[max] ? regionStats[max].averageScore : 0) ? region : max, Object.keys(regionStats)[0]
                          )
                        : '--'
                      }
                    </p>
                    <p className="text-xs text-purple-600">
                      {Object.keys(regionStats).length > 0 
                        ? Math.max(...Object.values(regionStats).map((s: any) => s.averageScore)).toLocaleString()
                        : '0'
                      } pts
                    </p>
                  </div>
                  <Star size={24} className="text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Total de Heróis</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {Object.keys(regionStats).length > 0 
                        ? Object.values(regionStats).reduce((sum: number, stats: any) => sum + (stats.classifications?.HEROI || 0), 0)
                        : 0
                      }
                    </p>
                    <p className="text-xs text-orange-600">Em todas as regiões</p>
                  </div>
                  <Crown size={24} className="text-orange-600" />
                </div>
              </div>
            </div>

            {/* Grid Detalhado das Regiões */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.entries(regionStats)
                .sort(([a], [b]) => {
                  const numA = parseInt(a.replace('R', ''));
                  const numB = parseInt(b.replace('R', ''));
                  return numA - numB;
                })
                .map(([region, stats]: [string, any]) => {
                  const maxScore = Math.max(...Object.values(regionStats).map((s: any) => s.averageScore));
                  const scorePercentage = (stats.averageScore / maxScore) * 100;
                  const totalClubs = stats.total;
                  const heroPercentage = totalClubs > 0 ? (stats.classifications.HEROI / totalClubs) * 100 : 0;
                  const escudeiroPercentage = totalClubs > 0 ? (stats.classifications.FIEL_ESCUDEIRO / totalClubs) * 100 : 0;
                  const aprendizPercentage = totalClubs > 0 ? (stats.classifications.APRENDIZ / totalClubs) * 100 : 0;

                  return (
                    <div key={region} className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-shadow duration-300">
                      {/* Header da Região */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{region}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{region}</h4>
                            <p className="text-xs text-gray-500">Região {region.replace('R', '')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">{totalClubs}</div>
                          <div className="text-xs text-gray-500">clubes</div>
                        </div>
                      </div>

                      {/* Pontuação Média com Barra de Progresso */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Pontuação Média</span>
                          <span className="text-sm font-bold text-blue-600">{stats.averageScore.toLocaleString()} pts</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${scorePercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Distribuição de Classificações */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Distribuição por Classificação</div>
                        
                        {/* Heróis */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Crown size={14} className="text-yellow-500" />
                            <span className="text-xs text-gray-600">Heróis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-yellow-500 h-1.5 rounded-full"
                                style={{ width: `${heroPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium w-6 text-right">{stats.classifications.HEROI}</span>
                          </div>
                        </div>

                        {/* Escudeiros */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy size={14} className="text-blue-500" />
                            <span className="text-xs text-gray-600">Escudeiros</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${escudeiroPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium w-6 text-right">{stats.classifications.FIEL_ESCUDEIRO}</span>
                          </div>
                        </div>

                        {/* Aprendizes */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target size={14} className="text-green-500" />
                            <span className="text-xs text-gray-600">Aprendizes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${aprendizPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium w-6 text-right">{stats.classifications.APRENDIZ}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer com Estatísticas Extras */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <TrendingUp size={12} />
                            <span>Performance</span>
                          </div>
                          <div className="font-medium">
                            {scorePercentage.toFixed(1)}% do máximo
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Ranking Completo das Regiões */}
            <div className="mt-8 space-y-6">
              
              {/* Header do Ranking com Estatísticas Gerais */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Trophy size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Ranking das Regiões</h3>
                      <p className="text-blue-100">Classificação por pontuação média e performance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{Object.keys(regionStats).length}</div>
                    <div className="text-blue-100 text-sm">Regiões Ativas</div>
                  </div>
                </div>

                {/* Estatísticas Rápidas do Ranking */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Object.keys(regionStats).length > 0 
                        ? Math.max(...Object.values(regionStats).map((s: any) => s.averageScore)).toLocaleString()
                        : '0'
                      }
                    </div>
                    <div className="text-white/80 text-xs">Maior Pontuação</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Object.keys(regionStats).length > 0 
                        ? Math.min(...Object.values(regionStats).map((s: any) => s.averageScore)).toLocaleString()
                        : '0'
                      }
                    </div>
                    <div className="text-white/80 text-xs">Menor Pontuação</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Object.keys(regionStats).length > 0 
                        ? Math.max(...Object.values(regionStats).map((s: any) => s.total))
                        : 0
                      }
                    </div>
                    <div className="text-white/80 text-xs">Mais Clubes</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Object.keys(regionStats).length > 0 
                        ? Object.values(regionStats).reduce((sum: number, stats: any) => sum + (stats.classifications?.HEROI || 0), 0)
                        : 0
                      }
                    </div>
                    <div className="text-white/80 text-xs">Total de Heróis</div>
                  </div>
                </div>
              </div>

              {/* Pódio das 3 Primeiras Regiões */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h4 className="text-xl font-bold mb-6 text-center text-gray-800">🏆 Pódio das Regiões 🏆</h4>
                {Object.keys(regionStats).length > 0 ? (
                  <div className="flex items-end justify-center gap-4 mb-8">
                    {Object.entries(regionStats)
                      .sort(([,a], [,b]) => (b as any).averageScore - (a as any).averageScore)
                      .slice(0, 3)
                      .map(([region, stats]: [string, any], index) => {
                      const actualIndex = index === 1 ? 0 : index === 0 ? 1 : 2; // Reordenar para pódio (2º, 1º, 3º)
                      const heights = ['h-32', 'h-40', 'h-24']; // Alturas do pódio
                      const colors = ['bg-yellow-400', 'bg-gray-400', 'bg-orange-400'];
                      const textColors = ['text-yellow-800', 'text-gray-800', 'text-orange-800'];
                      const medals = ['🥇', '🥈', '🥉'];
                      
                      return (
                        <div key={region} className={`flex flex-col items-center ${actualIndex === 1 ? 'order-2' : actualIndex === 0 ? 'order-1' : 'order-3'}`}>
                          <div className="text-4xl mb-2">{medals[actualIndex]}</div>
                          <div className={`${colors[actualIndex]} ${heights[actualIndex]} w-24 rounded-t-xl flex flex-col justify-end items-center p-4`}>
                            <div className={`${textColors[actualIndex]} font-bold text-lg`}>{region}</div>
                            <div className={`${textColors[actualIndex]} text-sm font-medium`}>{stats.averageScore.toLocaleString()}</div>
                            <div className={`${textColors[actualIndex]} text-xs`}>pts</div>
                          </div>
                          <div className="mt-3 text-center">
                            <div className="text-sm font-medium text-gray-700">{stats.total} clubes</div>
                            <div className="text-xs text-gray-500">{stats.classifications.HEROI} heróis</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma região encontrada</p>
                    <p className="text-sm text-gray-400">Cadastre clubes para ver o ranking das regiões</p>
                  </div>
                )}
              </div>

              {/* Tabela Completa do Ranking */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 size={20} />
                    Ranking Completo das Regiões
                  </h4>
                </div>
                
                {Object.keys(regionStats).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posição</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Região</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pontuação Média</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Clubes</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Heróis</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Escudeiros</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aprendizes</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(regionStats)
                          .sort(([,a], [,b]) => (b as any).averageScore - (a as any).averageScore)
                          .map(([region, stats]: [string, any], index) => {
                            const maxScore = Math.max(...Object.values(regionStats).map((s: any) => s.averageScore));
                            const performancePercentage = maxScore > 0 ? ((stats as any).averageScore / maxScore) * 100 : 0;
                            const isTopThree = index < 3;
                          
                          return (
                            <tr key={region} className={`hover:bg-gray-50 transition-colors ${isTopThree ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''}`}>
                              {/* Posição */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                    index === 0 ? 'bg-yellow-500 text-white' :
                                    index === 1 ? 'bg-gray-400 text-white' :
                                    index === 2 ? 'bg-orange-500 text-white' :
                                    'bg-blue-500 text-white'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  {isTopThree && (
                                    <span className="text-2xl">
                                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Região */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">{region}</span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{region}</div>
                                    <div className="text-sm text-gray-500">Região {region.replace('R', '')}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Pontuação Média */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-lg font-bold text-gray-900">{(stats as any).averageScore.toLocaleString()}</div>
                                <div className="text-sm text-gray-500">pontos</div>
                              </td>

                              {/* Total de Clubes */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Building2 size={16} className="text-gray-400" />
                                  <span className="font-semibold text-gray-900">{(stats as any).total}</span>
                                </div>
                              </td>

                              {/* Heróis */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Crown size={16} className="text-yellow-500" />
                                  <span className="font-semibold text-yellow-700">{(stats as any).classifications.HEROI}</span>
                                </div>
                              </td>

                              {/* Escudeiros */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Trophy size={16} className="text-blue-500" />
                                  <span className="font-semibold text-blue-700">{(stats as any).classifications.FIEL_ESCUDEIRO}</span>
                                </div>
                              </td>

                              {/* Aprendizes */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Target size={16} className="text-green-500" />
                                  <span className="font-semibold text-green-700">{(stats as any).classifications.APRENDIZ}</span>
                                </div>
                              </td>

                              {/* Performance */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        performancePercentage >= 80 ? 'bg-green-500' :
                                        performancePercentage >= 60 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${performancePercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{performancePercentage.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">Nenhuma região encontrada</p>
                    <p className="text-sm text-gray-400">Cadastre clubes para visualizar o ranking completo</p>
                  </div>
                )}
              </div>

              {/* Análise de Distribuição */}
              {Object.keys(regionStats).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Gráfico de Distribuição de Pontuações */}
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp size={20} />
                      Distribuição de Pontuações
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(regionStats)
                        .sort(([,a], [,b]) => (b as any).averageScore - (a as any).averageScore)
                        .map(([region, stats]: [string, any]) => {
                          const maxScore = Math.max(...Object.values(regionStats).map((s: any) => s.averageScore));
                          const width = maxScore > 0 ? ((stats as any).averageScore / maxScore) * 100 : 0;
                        
                        return (
                          <div key={region} className="flex items-center gap-3">
                            <div className="w-8 text-sm font-medium text-gray-600">{region}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${width}%` }}
                              >
                                {width > 20 && <span className="text-xs text-white font-medium">{(stats as any).averageScore.toLocaleString()}</span>}
                              </div>
                            </div>
                            {width <= 20 && <span className="text-xs text-gray-600 w-16 text-right">{(stats as any).averageScore.toLocaleString()}</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Estatísticas de Classificações */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award size={20} />
                    Distribuição de Classificações
                  </h4>
                  <div className="space-y-4">
                    {['HEROI', 'FIEL_ESCUDEIRO', 'APRENDIZ'].map((classification) => {
                      const total = Object.values(regionStats).reduce((sum: number, stats: any) => sum + stats.classifications[classification], 0);
                      const totalClubs = Object.values(regionStats).reduce((sum: number, stats: any) => sum + stats.total, 0);
                      const percentage = totalClubs > 0 ? (total / totalClubs) * 100 : 0;
                      
                      return (
                        <div key={classification} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {classification === 'HEROI' ? <Crown size={16} className="text-yellow-500" /> :
                               classification === 'FIEL_ESCUDEIRO' ? <Trophy size={16} className="text-blue-500" /> :
                               <Target size={16} className="text-green-500" />}
                              <span className="text-sm font-medium capitalize">
                                {classification === 'FIEL_ESCUDEIRO' ? 'Escudeiros' : 
                                 classification === 'HEROI' ? 'Heróis' : 'Aprendizes'}
                              </span>
                            </div>
                            <div className="text-sm font-bold">{total} ({percentage.toFixed(1)}%)</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                classification === 'HEROI' ? 'bg-yellow-500' :
                                classification === 'FIEL_ESCUDEIRO' ? 'bg-blue-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNewClubForm = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Cadastrar Novo Clube</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Clube *
          </label>
          <input
            type="text"
            value={newClubData.name}
            onChange={(e) => setNewClubData({ ...newClubData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite o nome do clube"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Região *
          </label>
          <select
            value={newClubData.region}
            onChange={(e) => setNewClubData({ ...newClubData, region: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione uma região</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={`R${i + 1}`}>Região {i + 1}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Inscritos
          </label>
          <input
            type="number"
            value={newClubData.membersCount}
            onChange={(e) => setNewClubData({ ...newClubData, membersCount: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
            placeholder="0"
          />
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            onClick={() => {
              setShowNewClubForm(false);
              setNewClubData({ name: "", region: "", membersCount: 0 });
            }}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateClub}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Cadastrar Clube
          </button>
        </div>
      </div>
    </div>
  );

  const renderClubs = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Gerenciar Clubes</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nome, região ou classificação..."
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Regiões</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={`R${i + 1}`}>Região {i + 1}</option>
            ))}
          </select>
          <button
            onClick={() => setShowNewClubForm(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 whitespace-nowrap"
          >
            + Novo Clube
          </button>
          <button
            onClick={handleResetClubsToMaxScore}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 whitespace-nowrap"
          >
            Inicializar Clubes
          </button>
        </div>
      </div>

      {showNewClubForm && renderNewClubForm()}

      {(clubSearch || selectedRegion !== "all") && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-blue-800 text-sm">
            Mostrando {filteredClubs?.length || 0} de {clubs?.length || 0} clubes
            {clubSearch && ` para "${clubSearch}"`}
            {selectedRegion !== "all" && ` na ${selectedRegion}`}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clube
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Região
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Inscritos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pontuação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Classificação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClubs?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {clubSearch || selectedRegion !== "all" ? "Nenhum clube encontrado para os filtros aplicados" : "Nenhum clube cadastrado"}
                  </td>
                </tr>
              ) : (
                filteredClubs?.map((club) => (
                  <tr key={club._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{club.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{club.region}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{club.membersCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                      {club.totalScore.toLocaleString()} pts
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        club.classification === "HEROI" 
                          ? "bg-purple-100 text-purple-800"
                          : club.classification === "FIEL_ESCUDEIRO"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {club.classification === "HEROI" ? "HERÓI" : 
                         club.classification === "FIEL_ESCUDEIRO" ? "FIEL ESCUDEIRO" : 
                         club.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        club.isActive 
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {club.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEvaluation(club)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200"
                        >
                          <FileText size={16} />
                          Avaliar
                        </button>
                        <button
                          onClick={() => handleDeleteClub(club._id, club.name)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Usuários do Sistema</h2>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Região/Clube
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.filter(u => u.role !== "admin").map((userItem) => (
                <tr key={userItem._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{userItem.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize">{userItem.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userItem.role === "director" || userItem.role === "secretary" ? (
                      <div>
                        <div className="font-medium">{(userItem as any).club?.name || "Clube não definido"}</div>
                        <div className="text-sm text-gray-500">{userItem.region || "-"}</div>
                      </div>
                    ) : (
                      userItem.region || "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userItem.isActive 
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {userItem.isActive ? "Ativo" : "Inativo"}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userItem.isApproved 
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {userItem.isApproved ? "Aprovado" : "Pendente"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {!userItem.isApproved && (
                        <button
                          onClick={() => handleApproveUser(userItem._id, true)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200"
                        >
                          <Check size={16} />
                          Aprovar
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser({ userId: userItem._id, adminId: user._id })}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPending = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Usuários Aguardando Aprovação</h2>

      {pendingUsers?.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <div className="text-gray-400 mb-4">
            <CheckCircle size={64} />
          </div>
          <p className="text-gray-600">Nenhum usuário aguardando aprovação</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers?.map((pendingUser) => (
            <div key={pendingUser._id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{pendingUser.name}</h3>
                  <p className="text-gray-600 capitalize">{pendingUser.role}</p>
                  {pendingUser.region && <p className="text-sm text-gray-500">Região: {pendingUser.region}</p>}
                  {(pendingUser as any).club && <p className="text-sm text-gray-500">Clube: {(pendingUser as any).club.name}</p>}
                  <p className="text-xs text-gray-400">
                    Cadastrado em: {new Date(pendingUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApproveUser(pendingUser._id, false)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium flex items-center gap-2 transition-all duration-200"
                  >
                    <X size={18} />
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleApproveUser(pendingUser._id, true)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium flex items-center gap-2 transition-all duration-200"
                  >
                    <Check size={18} />
                    Aprovar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRanking = () => {
    // Filtrar e processar ranking
    const getFilteredRanking = () => {
      if (!allClubsForRanking) return [];
      
      let filteredClubs = allClubsForRanking;
      
      // Filtrar por região se não for "all"
      if (rankingRegion !== "all") {
        filteredClubs = allClubsForRanking.filter(club => {
          // Comparar com formato "R1", "R2", etc.
          const expectedRegion = `R${rankingRegion}`;
          return club.region === expectedRegion;
        });
      }
      
      // Retornar apenas top 10
      return filteredClubs.slice(0, 10);
    };

    const ranking = getFilteredRanking();
    
    return (
      <div className="space-y-6">
        {/* Header com filtro de região */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy size={24} className="text-yellow-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Ranking Top 10 {rankingRegion !== "all" ? `- Região ${rankingRegion}` : "Geral"}
              </h2>
              <p className="text-gray-600">
                {ranking.length} clubes encontrados
              </p>
            </div>
          </div>

          {/* Filtro de Região */}
          <div className="flex items-center space-x-3">
            <label htmlFor="ranking-region" className="text-sm font-medium text-gray-700">
              Filtrar por região:
            </label>
            <select
              id="ranking-region"
              value={rankingRegion}
              onChange={(e) => setRankingRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Regiões</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={(i + 1).toString()}>
                  Região {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista do Ranking */}
        {!allClubsForRanking ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Trophy size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Carregando ranking...</p>
              </div>
            </div>
          </div>
        ) : ranking.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Trophy size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Nenhum clube encontrado {rankingRegion !== "all" ? `na região ${rankingRegion}` : ""}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-3">
              {ranking.map((club, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                
                return (
                  <div 
                    key={club._id} 
                    className={`flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md ${
                      isFirst ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300" :
                      isSecond ? "bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300" :
                      isThird ? "bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300" :
                      "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        isFirst ? "bg-yellow-500 text-white shadow-lg" :
                        isSecond ? "bg-gray-400 text-white shadow-lg" :
                        isThird ? "bg-orange-500 text-white shadow-lg" :
                        "bg-blue-500 text-white"
                      }`}>
                        {isFirst ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : index + 1}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{club.name}</h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Building2 size={14} className="mr-1" />
                            Região {club.region}
                          </span>
                          <span className="flex items-center">
                            <Users size={14} className="mr-1" />
                            {club.membersCount} membros
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {club.totalScore?.toLocaleString()} pts
                      </div>
                      <div className="flex items-center justify-end space-x-2 mt-1">
                        {club.classification === "HEROI" ? (
                          <div className="flex items-center text-yellow-600 font-medium">
                            <Crown size={16} className="mr-1" />
                            HERÓI
                          </div>
                        ) : club.classification === "FIEL_ESCUDEIRO" ? (
                          <div className="flex items-center text-blue-600 font-medium">
                            <Trophy size={16} className="mr-1" />
                            FIEL ESCUDEIRO
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600 font-medium">
                            <Target size={16} className="mr-1" />
                            APRENDIZ
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScoring = () => {
    const currentCriteria = editingCriteria || scoringCriteria;
    
    if (!currentCriteria) {
      return <div>Carregando critérios...</div>;
    }

    const updateCriteriaValue = (category: string, subcategory: string, field: string, value: number) => {
      const newCriteria = { ...currentCriteria };
      
      if (subcategory.includes('.')) {
        // Para carousel (events.carousel.abel)
        const [subcat, item] = subcategory.split('.');
        newCriteria[category][subcat][item][field] = value;
      } else {
        newCriteria[category][subcategory][field] = value;
      }
      
      setEditingCriteria(newCriteria);
    };

    const renderCriteriaSection = (title: any, category: string, data: any, isDemerits = false) => (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          {title}
          {isDemerits && <AlertTriangle size={16} className="ml-2 text-red-500" />}
        </h3>
        <div className="space-y-4">
          {Object.entries(data).map(([key, item]: [string, any]) => {
            if (key === 'carousel') {
              return (
                <div key={key} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-medium mb-2">Carrossel de Atividades</h4>
                  <div className="space-y-3">
                    {Object.entries(item).map(([carouselKey, carouselItem]: [string, any]) => (
                      <div key={carouselKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 font-bold">{carouselItem.description}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium">Máximo:</label>
                          <input
                            type="number"
                            value={carouselItem.max || 0}
                            onChange={(e) => updateCriteriaValue(category, `carousel.${carouselKey}`, 'max', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-center"
                            disabled={!editingCriteria}
                          />
                          {carouselItem.partial !== undefined && (
                            <>
                              <label className="text-sm font-medium">Parcial:</label>
                              <input
                                type="number"
                                value={carouselItem.partial || 0}
                                onChange={(e) => updateCriteriaValue(category, `carousel.${carouselKey}`, 'partial', parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border rounded text-center"
                                disabled={!editingCriteria}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm text-gray-600 font-bold">{item.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {isDemerits ? (
                    <>
                      <label className="text-sm font-medium text-red-600">Penalidade:</label>
                      <input
                        type="number"
                        value={item.penalty || 0}
                        onChange={(e) => updateCriteriaValue(category, key, 'penalty', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded text-center"
                        disabled={!editingCriteria}
                      />
                    </>
                  ) : (
                    <>
                      <label className="text-sm font-medium">Máximo:</label>
                      <input
                        type="number"
                        value={item.max || 0}
                        onChange={(e) => updateCriteriaValue(category, key, 'max', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded text-center"
                        disabled={!editingCriteria}
                      />
                      {item.partial !== undefined && (
                        <>
                          <label className="text-sm font-medium">Parcial:</label>
                          <input
                            type="number"
                            value={item.partial || 0}
                            onChange={(e) => updateCriteriaValue(category, key, 'partial', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-center"
                            disabled={!editingCriteria}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Critérios de Pontuação</h2>
          <div className="flex space-x-3">
            {editingCriteria ? (
              <>
                <button
                  onClick={() => setEditingCriteria(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateCriteria}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Salvar Critérios
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditingCriteria({ ...currentCriteria })}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Editar Critérios
                </button>
                <button
                  onClick={handleResetCriteria}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Resetar para Padrão
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <div className="flex items-center">
            <Lightbulb size={16} className="text-amber-600 mr-2" />
            <div className="text-amber-800">
              <p className="font-medium">Sistema de Pontuação Aditivo</p>
              <p className="text-sm">
                Os critérios definem as pontuações disponíveis para cada requisito. Os clubes iniciam com zero pontos e ganham pontos conforme atendem aos critérios.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderCriteriaSection(
            <span className="flex items-center gap-2">
              <ClipboardList size={20} />
              Pré-requisitos
            </span>, 
            "prerequisites", currentCriteria.prerequisites
          )}
          {renderCriteriaSection(
            <span className="flex items-center gap-2">
              <Users size={20} />
              Participação
            </span>, 
            "participation", currentCriteria.participation
          )}
          {renderCriteriaSection(
            <span className="flex items-center gap-2">
              <Target size={20} />
              Critérios Gerais
            </span>, 
            "general", currentCriteria.general
          )}
          {renderCriteriaSection(
            <span className="flex items-center gap-2">
              <Star size={20} />
              Eventos
            </span>, 
            "events", currentCriteria.events
          )}
          {renderCriteriaSection(
            <span className="flex items-center gap-2">
              <Trophy size={20} />
              Bônus
            </span>, 
            "bonus", currentCriteria.bonus
          )}
          {renderCriteriaSection(
            <span className="flex items-center gap-2">
              <X size={20} />
              Deméritos
            </span>, 
            "demerits", currentCriteria.demerits, true
          )}
        </div>
      </div>
    );
  };

  const renderPDF = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gerar PDF de Avaliação</h2>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center">
          <FileText size={16} className="text-blue-600 mr-2" />
          <div className="text-blue-800">
            <p className="font-medium">Ficha de Avaliação Compacta</p>
            <p className="text-sm">
              Gera um PDF em uma única folha com todos os critérios de avaliação organizados de forma compacta para uso durante o evento.
            </p>
          </div>
        </div>
      </div>

      {/* Geração Individual */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText size={20} />
          Geração Individual
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o Clube
            </label>
            <select
              value={selectedClubForPDF}
              onChange={(e) => setSelectedClubForPDF(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um clube...</option>
              {clubs?.map((club) => (
                <option key={club._id} value={club._id}>
                  {club.name} - {club.region}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center pt-4">
            <button
              onClick={generatePDF}
              disabled={!selectedClubForPDF}
              className={`px-6 py-3 rounded-lg font-medium ${
                selectedClubForPDF
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FileText size={16} className="mr-2" />
              Gerar Ficha Individual (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Geração em Lote por Região */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package size={20} />
          Geração em Lote por Região
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Gera PDFs de avaliação para todos os clubes de uma região específica.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => {
            const region = `R${i + 1}`;
            const regionClubs = clubs?.filter(club => club.region === region) || [];
            const isGenerating = generatingBatchPDF === region;
            
            return (
              <div key={region} className="border border-gray-200 rounded-lg p-4">
                <div className="text-center mb-3">
                  <h4 className="font-semibold text-lg">{region}</h4>
                  <p className="text-sm text-gray-600">
                    {regionClubs.length} clube{regionClubs.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <button
                  onClick={() => generateBatchPDFByRegion(region)}
                  disabled={regionClubs.length === 0 || isGenerating}
                  className={`w-full px-4 py-2 rounded-lg font-medium text-sm ${
                    regionClubs.length === 0
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : isGenerating
                      ? "bg-yellow-500 text-white cursor-wait"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin inline-block mr-2" />
                      Gerando...
                    </>
                  ) : regionClubs.length === 0 ? (
                    "Sem clubes"
                  ) : (
                    <>
                      <Package size={16} className="mr-2" />
                      {`Gerar ${regionClubs.length} PDF${regionClubs.length !== 1 ? 's' : ''}`}
                    </>
                  )}
                </button>
                
                {regionClubs.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <div className="max-h-20 overflow-y-auto">
                      {regionClubs.map((club, index) => (
                        <div key={club._id} className="truncate">
                          {index + 1}. {club.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ferramentas do Sistema</h2>

      {/* Seção de Ferramentas de Manutenção */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-blue-600 flex items-center gap-2">
          <Settings size={20} />
          Ferramentas de Manutenção
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-2">Correção de Dados</h4>
            <p className="text-sm text-gray-600 mb-3">
              Ferramentas para corrigir inconsistências nos dados do sistema.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleFixClubScores}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
              >
                Corrigir Pontuações dos Clubes
              </button>
              <button
                onClick={handleReclassifyAllClubs}
                className="w-full bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 text-sm"
              >
                Reclassificar Todos os Clubes
              </button>
              <button
                onClick={handleValidateClassifications}
                className="w-full bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 text-sm"
              >
                Validar Classificações
              </button>
            </div>
          </div>

          <div className="border border-green-200 p-4 rounded-lg">
            <h4 className="font-semibold text-green-700 mb-2">Inicialização</h4>
            <p className="text-sm text-gray-600 mb-3">
              Ferramentas para resetar pontuação dos clubes para o valor máximo (3050 pontos).
            </p>
            <div className="space-y-2">
              <button
                onClick={handleResetClubsToMaxScore}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Resetar Pontuação dos Clubes
              </button>
              <button
                onClick={handleFixInitialClassifications}
                className="w-full bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 text-sm"
              >
                Corrigir Classificações Iniciais
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Estatísticas do Sistema */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <BarChart3 size={20} />
          Estatísticas do Sistema
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{clubs?.length || 0}</div>
            <div className="text-sm text-blue-800">Total de Clubes</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {users?.filter(u => u.isActive && u.isApproved).length || 0}
            </div>
            <div className="text-sm text-green-800">Usuários Ativos</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingUsers?.length || 0}</div>
            <div className="text-sm text-yellow-800">Pendentes</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {classificationStats?.HEROI || 0}
            </div>
            <div className="text-sm text-purple-800">Clubes Herói</div>
          </div>
        </div>
      </div>

      {/* Informações sobre o Sistema Aditivo */}
      <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
          <Lightbulb size={20} />
          Sistema de Pontuação Aditivo
        </h3>
        <div className="space-y-3 text-green-800">
          <p className="text-sm">
            <strong>Funcionamento:</strong> Todos os clubes iniciam com pontuação zero.
          </p>
          <p className="text-sm">
            <strong>Durante o evento:</strong> Os pontos são atribuídos conforme os critérios são atendidos e avaliados.
          </p>
          <p className="text-sm">
            <strong>Objetivo:</strong> Recompensar os clubes pelos critérios que conseguem atender durante o evento.
          </p>
        </div>
      </div>

      {/* Seção de Logs de Atividade */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <History size={20} />
            Diagnóstico do Sistema
          </h3>
          <button
            onClick={handleShowActivityLogs}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm flex items-center gap-2"
          >
            <History size={16} />
            Ver Logs de Atividade
          </button>
        </div>
        
        {showActivityLogs && (
          <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-3 text-gray-800">Últimos Acessos dos Usuários</h4>
            {activityLogs && activityLogs.length > 0 ? (
              <div className="space-y-2">
                {activityLogs.map((log: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        log.role === 'admin' ? 'bg-red-500' :
                        log.role === 'regional' ? 'bg-blue-500' :
                        log.role === 'director' ? 'bg-green-500' :
                        log.role === 'secretary' ? 'bg-green-400' :
                        'bg-purple-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-gray-800">{log.name}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {log.role === 'admin' ? 'Administrador' :
                           log.role === 'regional' ? 'Regional' :
                           log.role === 'director' ? 'Diretor' :
                           log.role === 'secretary' ? 'Secretário' :
                           'Staff'}
                          {log.region && ` - ${log.region}`}
                          {log.clubName && ` - ${log.clubName}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">
                        {new Date(log.lastLoginAt).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.lastLoginAt).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum log de atividade encontrado</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "evaluation":
        return renderEvaluation();
      case "clubs":
        return renderClubs();
      case "users":
        return renderUsers();
      case "pending":
        return renderPending();
      case "ranking":
        return renderRanking();
      case "scoring":
        return renderScoring();
      case "pdf":
        return renderPDF();
      case "system":
        return renderSystem();
      default:
        return renderOverview();
    }
  };

  console.log("AdminDashboard: About to render JSX");

  // Debug: verificar se alguma query está undefined
  if (clubs === undefined || users === undefined || scoringCriteria === undefined) {
    console.log("AdminDashboard: Some queries are still loading", { 
      clubs: clubs === undefined ? "loading" : "loaded",
      users: users === undefined ? "loading" : "loaded", 
      scoringCriteria: scoringCriteria === undefined ? "loading" : "loaded"
    });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo no Topo */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Principal */}
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Settings size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
                <h2 className="text-indigo-100 text-base mt-1 font-semibold">
                  Bem-vindo, {user.name || 'Administrador'}
                </h2>
              </div>
            </div>
            
            {/* Menu do Usuário */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 border border-white/20 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {(user.name || 'Admin').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium">{user.name || 'Administrador'}</p>
                    <p className="text-xs text-indigo-200">Admin</p>
                  </div>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name || 'Administrador'}</p>
                        <p className="text-sm text-gray-500">Admin do Sistema</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <User size={16} />
                      Meu Perfil
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <DoorOpen size={16} />
                      Sair do Sistema
                    </button>
                  </div>
                </div>
              )}
              
              {/* Overlay para fechar o menu */}
              {showUserMenu && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
              )}
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-t border-white/10 mt-2">
            <div className="flex space-x-0 overflow-x-auto scrollbar-hide -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-4 font-medium text-sm whitespace-nowrap transition-all duration-200 min-w-max ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-700 border-b-2 border-indigo-600 -mb-px"
                      : "text-indigo-100 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className={activeTab === tab.id ? "text-indigo-600" : "text-current"}>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content com espaço para header fixo */}
      <div className="pt-32 sm:pt-36 md:pt-40 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error("AdminDashboard: Error rendering component", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro no AdminDashboard</h2>
          <p className="text-gray-600 mb-4">Ocorreu um erro ao carregar o painel.</p>
          <pre className="text-sm bg-gray-100 p-4 rounded">{String(error)}</pre>
          <button 
            onClick={onLogout}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }
}
