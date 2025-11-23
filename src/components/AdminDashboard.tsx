import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { AdminScoringMobile } from "./AdminScoringMobile";
import { CriteriaManager } from "./CriteriaManager";
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
  RefreshCw,
  MapPin,
  Award,
  TrendingUp,
  User,
  Shield,
  ChefHat,
  Zap,
  ListChecks,
  Filter,
  CheckSquare,
  BarChart2,
  FileCheck
} from "lucide-react";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  console.log("=== ADMINDASHBOARD START ===");
  console.log("AdminDashboard: Component is rendering", { user });
  console.log("AdminDashboard: Props received", { user, onLogout });

  // Versão simplificada para debug
    const [activeTab, setActiveTab] = useState("overview");
    const [editingCriteria, setEditingCriteria] = useState<any>(null);
    const [clubSearch, setClubSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");
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
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedClubForScoring, setSelectedClubForScoring] = useState<string>("");
    const [activityLogFilter, setActivityLogFilter] = useState<string>("all");
    
    // Estados para a interface de Pontuação
    const [showScoringModal, setShowScoringModal] = useState(false);
    const [scoringModalMode, setScoringModalMode] = useState<'create' | 'edit'>('create');
    const [scoringSelectedCategory, setScoringSelectedCategory] = useState<string>('');
    const [editingCriterionKey, setEditingCriterionKey] = useState<any>(null);
    const [scoringFormData, setScoringFormData] = useState({
      key: '',
      description: '',
      max: 0,
      partial: 0
    });

    // Estados para Avaliação em Lote
    const [evaluationMode, setEvaluationMode] = useState<'individual' | 'batch'>('individual');
    const [batchCategory, setBatchCategory] = useState<string>('');
    const [batchCriterion, setBatchCriterion] = useState<string>('');
    const [selectedClubsForBatch, setSelectedClubsForBatch] = useState<string[]>([]);
    const [batchScoreType, setBatchScoreType] = useState<'maximum' | 'partial' | 'zero'>('maximum');
    const [batchNotes, setBatchNotes] = useState<string>('');

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

    // Query para logs de atividade de usuários
    const activityLogs = useQuery(api.users.getActivityLogs, {});
    
    // Query para logs detalhados de avaliação
    const evaluationLogs = useQuery(api.clubs.getDetailedEvaluationLogs, {});
    
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

    // Query para clubes não avaliados (avaliação em lote)
    const unevaluatedClubs = useQuery(
      api.evaluation.getUnevaluatedClubs,
      batchCategory && batchCriterion ? {
        category: batchCategory,
        criteriaKey: batchCriterion,
      } : "skip"
    );

    // Mutations - DEVEM vir antes de qualquer return condicional
    const approveUser = useMutation(api.users.approveUser);
    const updateUser = useMutation(api.users.updateUser);
    const deleteUser = useMutation(api.users.deleteUser);
    const initializeClubs = useMutation(api.clubs.initializeClubs);
    const resetClubsToMaxScore = useMutation(api.clubs.resetAllClubScores);
    const resetScoringCriteria = useMutation(api.scoring.resetScoringCriteria);
    const createScoringCriterion = useMutation(api.scoring.createScoringCriterion);
    const updateScoringCriterion = useMutation(api.scoring.updateScoringCriterion);
    const deleteScoringCriterion = useMutation(api.scoring.deleteScoringCriterion);
    const fixClubScores = useMutation(api.clubs.fixClubScores);
    const reclassifyAllClubs = useMutation(api.classification.reclassifyAllClubs);
    const validateAllClassifications = useMutation(api.classification.validateAllClassifications);
    const fixInitialClassifications = useMutation(api.classification.fixInitialClassifications);
    const updateClubScores = useMutation(api.clubs.updateClubScores);
    const batchEvaluateClubs = useMutation(api.evaluation.batchEvaluateClubs);
    const lockCriteria = useMutation(api.evaluation.lockCriteria);
    const unlockCriteria = useMutation(api.evaluation.unlockCriteria);
    const clearAllCriteriaLocks = useMutation(api.evaluation.clearAllCriteriaLocks);
    const clearAllActivityLogs = useMutation(api.clubs.clearAllActivityLogs);
    const migrateOldBatchEvaluations = useMutation(api.evaluation.migrateOldBatchEvaluations);
    const importClubsBatch = useMutation(api.clubs.importClubsBatch);
    const deleteClub = useMutation(api.clubs.deleteClub);
    const createClub = useMutation(api.clubs.createClub);
    
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
              MISSIONÁRIO: 0,
              VOLUNTÁRIO: 0,
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
      if (!clubs || clubs.length === 0) return { MISSIONÁRIO: 0, VOLUNTÁRIO: 0, APRENDIZ: 0 };
      
      const stats = { MISSIONÁRIO: 0, VOLUNTÁRIO: 0, APRENDIZ: 0 };
      
      clubs.forEach(club => {
        if (club.classification) {
          stats[club.classification as keyof typeof stats]++;
        } else {
          stats.APRENDIZ++;
        }
      });
      
      return stats;
    };

    console.log("AdminDashboard: All queries called, checking loading state...");
    console.log("AdminDashboard: clubs", { clubs, isUndefined: clubs === undefined });
    console.log("AdminDashboard: users", { users, isUndefined: users === undefined });
    console.log("AdminDashboard: scoringCriteria", { scoringCriteria, isUndefined: scoringCriteria === undefined });

    // Verificação de loading - se alguma query principal está ainda carregando
    if (clubs === undefined || users === undefined || scoringCriteria === undefined) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando painel administrativo...</p>
          </div>
        </div>
      );
    }

    // Estatísticas calculadas dinamicamente
    const regionStats = calculateRegionStats();
    const classificationStats = calculateClassificationStats();

  // Função para calcular pontuação total baseada na estrutura de pontuações
  // SISTEMA: Clubes iniciam com 1910 pontos e PERDEM pontos por não atender critérios
  const calculateTotalScore = (scores: any) => {
    if (!scores || !scoringCriteria) return 1910; // Pontuação máxima inicial

    const MAX_SCORE = 1910;
    let totalPenalty = 0;
    let demeritsPenalty = 0;

    // Calcular penalidades baseado nos critérios dinâmicos
    Object.keys(scores).forEach(category => {
      if (!scoringCriteria[category]) return; // Ignorar categorias sem critérios

      const categoryScores = scores[category];
      if (typeof categoryScores !== 'object') return;

      // DEMÉRITOS: São valores negativos, somar diretamente
      if (category === 'demerits') {
        Object.keys(categoryScores).forEach(key => {
          const demeritValue = categoryScores[key];
          if (typeof demeritValue === 'number') {
            demeritsPenalty += Math.abs(demeritValue); // Converter para positivo para somar à penalidade
          }
        });
        return;
      }

      // OUTRAS CATEGORIAS: Sistema de penalidade por não atingir máximo
      Object.keys(categoryScores).forEach(key => {
        const earnedPoints = categoryScores[key];
        if (typeof earnedPoints !== 'number') return; // Ignorar objetos aninhados

        const criterion = scoringCriteria[category]?.[key];
        if (!criterion) return; // Ignorar critérios não definidos

        const maxPoints = criterion.max || 0;
        const partialPoints = criterion.partial || 0;

        // Calcular penalidade baseado no que foi conquistado
        let penalty = 0;

        if (earnedPoints === maxPoints) {
          // Ganhou pontuação máxima → Não perde nada
          penalty = 0;
        } else if (earnedPoints === partialPoints && partialPoints > 0) {
          // Ganhou pontuação parcial → Perde a diferença (max - parcial)
          penalty = maxPoints - partialPoints;
        } else if (earnedPoints === 0) {
          // Ganhou zero → Perde tudo (max)
          penalty = maxPoints;
        } else {
          // Caso customizado: perde a diferença entre max e o que ganhou
          penalty = maxPoints - earnedPoints;
        }

        totalPenalty += penalty;
      });
    });

    // Pontuação final = Máximo (1910) - Penalidades totais - Deméritos
    const finalScore = Math.max(0, MAX_SCORE - totalPenalty - demeritsPenalty);
    console.log(`📊 Admin calculateTotalScore: Penalidade Total=${totalPenalty}, Deméritos=${demeritsPenalty}, Final=${finalScore}`);
    return finalScore;
  };

  const getClassification = (totalScore: number): string => {
    if (totalScore >= 1496) return "MISSIONÁRIO";
    if (totalScore >= 1232) return "VOLUNTÁRIO";
    return "APRENDIZ";
  };



  const updateScore = (category: string, subcategory: string, value: any) => {
    console.log("📝 AdminDashboard.updateScore called:", { category, subcategory, value });
    
    const actualValue = typeof value === 'string' ? parseInt(value) : value;
    
    // Validar que pontuações não podem ser negativas (exceto deméritos que são sempre negativos)
    if (actualValue < 0 && category !== "demerits") {
      toast.error("Pontuações não podem ser negativas");
      return;
    }

    // Buscar valor máximo permitido (não aplicável para deméritos que podem ocorrer múltiplas vezes)
    if (scoringCriteria && category !== "demerits") {
      let maxValue = 0;
      let itemData = null;
      
      if (subcategory.includes('.')) {
        const [subcat, item] = subcategory.split('.');
        itemData = (scoringCriteria as any)[category]?.[subcat]?.[item];
      } else {
        itemData = (scoringCriteria as any)[category]?.[subcategory];
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
    
    // Garantir que a categoria existe
    if (!newScores[category]) {
      newScores[category] = {};
    }
    
    if (subcategory.includes('.')) {
      const [subcat, item] = subcategory.split('.');
      // Garantir que o subcategory existe
      if (!newScores[category][subcat]) {
        newScores[category][subcat] = {};
      }
      newScores[category][subcat][item] = actualValue;
    } else {
      newScores[category][subcategory] = actualValue;
    }
    
    console.log("📝 editingScores atualizado:", newScores);
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
    if (scores.campground) lockCategory("campground", scores.campground);
    if (scores.kitchen) lockCategory("kitchen", scores.kitchen);
    if (scores.participation) lockCategory("participation", scores.participation);
    if (scores.uniform) lockCategory("uniform", scores.uniform);
    if (scores.secretary) lockCategory("secretary", scores.secretary);
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
      prerequisites: { directorPresence: 0 },
      campground: { 
        portal: 0, clothesline: 0, pioneers: 0, campfireArea: 0, materials: 0, 
        tentOrganization: 0, security: 0, readyCamp: 0, chairsOrBench: 0 
      },
      kitchen: { 
        tentSetup: 0, identification: 0, tentSize: 0, gasRegister: 0, firePosition: 0, 
        refrigerator: 0, tables: 0, extinguisher: 0, menu: 0, menuDisplay: 0, 
        containers: 0, uniform: 0, handSanitizer: 0, washBasin: 0, cleaning: 0, 
        water: 0, identification2: 0 
      },
      participation: { 
        opening: 0, saturdayMorning: 0, saturdayEvening: 0, sundayMorning: 0, 
        saturdayAfternoon: 0, sundayEvening: 0, directorMeetingFriday: 0, directorMeetingSaturday: 0 
      },
      uniform: { programmedUniform: 0, badges: 0 },
      secretary: { firstAidKit: 0, secretaryFolder: 0, healthFolder: 0 },
      events: { carousel: 0, extraActivities: 0, representative: 0 },
      bonus: { pastorVisit: 0, healthProfessional: 0 },
      demerits: { 
        noIdentification: 0, unaccompanied: 0, inappropriate: 0, campingActivity: 0, 
        interference: 0, improperClothing: 0, disrespect: 0, improperBehavior: 0, 
        substances: 0, sexOpposite: 0, artificialFires: 0, unauthorizedVehicles: 0 
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
      const result = await resetClubsToMaxScore({});
      
      await clearAllCriteriaLocks({
        adminId: user._id,
      });
      
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
    console.log("🎯 handleSaveScores INICIADO", { selectedClub, editingScores });
    
    if (!selectedClub || !editingScores) return;
    
    try {
      console.log("AdminDashboard: Saving scores", { clubId: selectedClub._id, editingScores });
      
      // Atualizar pontuações do clube
      await updateClubScores({
        clubId: selectedClub._id,
        scores: editingScores,
        userId: user._id,
      });

      // Travar todos os critérios com pontuação > 0 que ainda não estão travados
      await lockAllEvaluatedCriteria(selectedClub._id, editingScores);
      
      toast.success("Pontuações salvas com sucesso!");
      setEditingScores(null);
      setSelectedClub(null); // Volta para a lista de clubes
      setActiveTab("clubs");
    } catch (error: any) {
      console.error("AdminDashboard: Error saving scores", error);
      toast.error(error.message);
    }
  };

  // Nova função: trava TODOS os critérios com pontuação > 0
  const lockAllEvaluatedCriteria = async (clubId: string, scores: any) => {
    const lockPromises: Promise<any>[] = [];

    const lockCategory = (category: string, categoryScores: any, parentKey?: string) => {
      if (!categoryScores) return;
      
      for (const [key, value] of Object.entries(categoryScores)) {
        // PRIMEIRO: verificar se é número válido para travar
        if (typeof value === 'number' && value > 0) {
          const criteriaKey = parentKey || key;
          const subKey = parentKey ? key : undefined;
          
          console.log("🔐 AdminDashboard: Preparando lock", {
            category,
            criteriaKey,
            subKey,
            fullPath: subKey ? `${category}.${criteriaKey}.${subKey}` : `${category}.${criteriaKey}`,
            score: value
          });
          
          lockPromises.push(
            lockCriteria({
              clubId: clubId as any,
              category: category,
              criteriaKey: criteriaKey,
              subKey: subKey,
              score: value as number,
              evaluatedBy: user._id,
            })
          );
        } 
        // SEGUNDO: se é objeto, fazer recursão
        else if (typeof value === 'object' && value !== null) {
          lockCategory(category, value, key);
        }
      }
    };

    // Travar todas as categorias (exceto deméritos)
    if (scores.prerequisites) lockCategory("prerequisites", scores.prerequisites);
    if (scores.campground) lockCategory("campground", scores.campground);
    if (scores.kitchen) lockCategory("kitchen", scores.kitchen);
    if (scores.participation) lockCategory("participation", scores.participation);
    if (scores.uniform) lockCategory("uniform", scores.uniform);
    if (scores.secretary) lockCategory("secretary", scores.secretary);
    if (scores.events) lockCategory("events", scores.events);
    if (scores.bonus) lockCategory("bonus", scores.bonus);

    await Promise.all(lockPromises);
    console.log("AdminDashboard: Locked", lockPromises.length, "criteria");
  };

  const lockModifiedCriteria = async (clubId: string, newScores: any) => {
    if (!selectedClubData?.scores) {
      console.log("AdminDashboard: No original scores found, locking all evaluated criteria");
      // Se não há scores originais, trava todos os critérios com valor > 0
      await lockAllEvaluatedCriteria(clubId, newScores);
      return;
    }
    
    const originalScores = selectedClubData.scores;
    const lockPromises: Promise<any>[] = [];

    // Comparar e travar apenas critérios modificados
    const compareAndLock = (category: string, originalCat: any = {}, newCat: any = {}, parentKey?: string) => {
      // Verificar se newCat é válido
      if (!newCat || typeof newCat !== 'object') return;
      
      for (const [key, newValue] of Object.entries(newCat)) {
        const originalValue = originalCat?.[key];
        
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
    compareAndLock("campground", originalScores.campground, newScores.campground);
    compareAndLock("kitchen", originalScores.kitchen, newScores.kitchen);
    compareAndLock("participation", originalScores.participation, newScores.participation);
    compareAndLock("uniform", originalScores.uniform, newScores.uniform);
    compareAndLock("secretary", originalScores.secretary, newScores.secretary);
    compareAndLock("events", originalScores.events, newScores.events);
    compareAndLock("bonus", originalScores.bonus, newScores.bonus);
    // ❌ DEMÉRITOS NÃO SÃO TRAVADOS - podem ocorrer múltiplas vezes durante o evento

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
      await updateScoringCriterion({
        category: editingCriteria.category,
        key: editingCriteria.key,
        description: editingCriteria.description,
        max: editingCriteria.max,
        partial: editingCriteria.partial,
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

  // Handler para avaliação em lote
  const handleBatchEvaluation = async () => {
    if (selectedClubsForBatch.length === 0) {
      toast.error("Selecione pelo menos um clube para avaliar");
      return;
    }

    if (!batchCategory || !batchCriterion) {
      toast.error("Selecione uma categoria e critério");
      return;
    }

    if (!scoringCriteria) {
      toast.error("Critérios de pontuação não carregados");
      return;
    }

    try {
      // Buscar critério para obter pontuações
      const categoryData = scoringCriteria[batchCategory];
      if (!categoryData) {
        toast.error("Categoria não encontrada");
        return;
      }

      const criterion = categoryData[batchCriterion];
      if (!criterion) {
        toast.error("Critério não encontrado");
        return;
      }

      const maxScore = criterion.max || 0;
      const partialScore = criterion.partial || 0;

      // Executar avaliação em lote
      const result = await batchEvaluateClubs({
        clubIds: selectedClubsForBatch as any,
        category: batchCategory,
        criteriaKey: batchCriterion,
        scoreType: batchScoreType,
        maxScore,
        partialScore,
        evaluatorId: user._id,
        notes: batchNotes || undefined,
      });

      if (result.successful > 0) {
        toast.success(`${result.successful} clube(s) avaliado(s) com sucesso!`);
      }
      
      if (result.failed > 0) {
        toast.warning(`${result.failed} clube(s) não puderam ser avaliados`);
      }

      // Limpar seleções
      setSelectedClubsForBatch([]);
      setBatchNotes('');
      setBatchCategory('');
      setBatchCriterion('');
      
    } catch (error: any) {
      toast.error(error.message || "Erro ao avaliar clubes");
    }
  };

  const toggleClubSelection = (clubId: string) => {
    setSelectedClubsForBatch(prev => 
      prev.includes(clubId) 
        ? prev.filter(id => id !== clubId)
        : [...prev, clubId]
    );
  };

  const selectAllUnevaluatedClubs = () => {
    if (unevaluatedClubs) {
      setSelectedClubsForBatch(unevaluatedClubs.map(c => c._id));
    }
  };

  const clearClubSelection = () => {
    setSelectedClubsForBatch([]);
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

  const handleImportClubs = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const clubs = JSON.parse(event.target?.result as string);
            const result = await importClubsBatch({ clubs, adminId: user._id });
            toast.success(result.message);
          } catch (error: any) {
            toast.error('Erro ao importar clubes: ' + error.message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
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
      pdf.text("FICHA DE AVALIAÇÃO - XXI CAMPORI PAULISTANA 2025", pageWidth / 2, y, { align: "center" });
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
        "□ Presença do diretor ou representante na reunião prévia – 30"
      ]);

      addSection("ÁREA DE ACAMPAMENTO", [
        "□ Portal identificado com nome do clube, igreja/distrito, município, região e associação – 40 (20)",
        "□ Local apropriado no acampamento para estender roupas e toalhas molhadas – 10 (5)",
        "□ Possuir ao menos 1 pequena pioneira – 10 (5)",
        "□ Área de acampamento devidamente cercada – 10 (5)",
        "□ Local apropriado para depósito de materiais do camping – 10 (5)",
        "□ Barracas organizadas conforme normas do fabricante – 40 (20)",
        "□ Presença do segurança na área de acampamento – 40 (20)",
        "□ Acampamento pronto, cercado, barracas montadas até 20h11 – 80 (40)",
        "□ Uso de cadeira ou banqueta para cada participante – 40 (20)"
      ]);

      addSection("COZINHA", [
        "□ Tenda de cozinha bem montada, sem acúmulo de água – 20 (10)",
        "□ Cozinha identificada com nome do clube, igreja/distrito – 10 (5)",
        "□ Tenda com tamanho suficiente para cobertura total – 10 (5)",
        "□ Mangueira e registro de gás em bom estado, dentro da validade – 20 (10)",
        "□ Fogão posicionado a no mínimo 50cm das paredes da tenda – 10 (5)",
        "□ Geladeira posicionada a no mínimo 30cm das paredes – 10 (5)",
        "□ Tomadas em local seco, afastado das paredes – 10",
        "□ Extintor de incêndio tipo ABC portátil 3A-20B EN010 – 20",
        "□ Cardápio ovo-lacto-vegetariano – 30",
        "□ Cardápio exposto na entrada da cozinha – 10 (5)",
        "□ Alimentos em recipientes e prateleiras adequadas – 10 (5)",
        "□ Equipe usando avental padronizado com identificação – 10 (5)",
        "□ Higienizador para mãos (álcool gel), visível e acessível – 10 (5)",
        "□ Lavatório com tampa – 10 (5)",
        "□ Local limpo e adequado para manipulação de alimentos – 20 (10)",
        "□ Água potável disponível na cozinha – 10 (5)",
        "□ Saqueta identificado com prato, copo e talheres – 10 (5)"
      ]);

      addSection("PARTICIPAÇÃO", [
        "□ 100% de presença no programa de abertura – 60 (30)",
        "□ 100% de presença no programa de sexta-feira manhã – 60 (30)",
        "□ 100% de presença no programa de sexta-feira noite – 60 (30)",
        "□ 100% de presença no programa de sábado manhã – 60 (30)",
        "□ 100% de presença no programa de sábado tarde – 60 (30)",
        "□ 100% de presença no programa de domingo manhã – 60 (30)",
        "□ Presença na reunião de diretoria sexta-feira – 30",
        "□ Presença na reunião de diretoria sábado – 30"
      ]);

      addSection("UNIFORME", [
        "□ 100% do clube uniformizado sábado manhã, uniforme A – 80 (40)",
        "□ Todas unidades portando bandeirim identificado – 40 (20)"
      ]);

      addSection("SECRETARIA", [
        "□ Kit primeiros socorros completo (Boletim Verde) – 100 (50)",
        "□ Pasta secretaria completa (Boletim Verde) – 100 (50)",
        "□ Pasta saúde completa (Boletim Verde) – 100 (50)"
      ]);

      addSection("PROVAS", [
        "□ Participação mínimo 4 provas carrossel aventura – 200",
        "□ Participação em 2 atividades extras – 100",
        "□ Mínimo um representante por clube no 24h – 50"
      ]);

      addSection("BÔNUS", [
        "□ Visita do pastor distrital durante o Campori – 50",
        "□ Profissional de Saúde (CRM/COREN) na escala – 100"
      ]);

      addSection("DEMÉRITOS", [
        "□ Membro do clube sem pulseira de identificação – -100",
        "□ Desbravador desacompanhado (por desbravador) – -100",
        "□ Uso de lanternas/laser, óculos, instrumentos de fanfarra inapropriado – -100",
        "□ Atividade na área acampamento ou som alto após silêncio – -100",
        "□ Visitas interferindo ou circulando fora período estipulado – -100",
        "□ Circular sem camisa/camiseta ou roupas inapropriadas – -100",
        "□ Desrespeito ao staff, agressão física ou verbal – -100",
        "□ Contato físico excessivo entre casais – -100",
        "□ Uso/posse de substâncias ilícitas ou bebidas alcoólicas – -100",
        "□ Entrar em barracas do sexo oposto – -100",
        "□ Uso de fogos artificiais – -100",
        "□ Veículos não autorizados fora de local/horário – -100"
      ]);

      // Resumo
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("RESUMO FINAL", margin, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.text("TOTAL GERAL: _________ pts (Máx: 1.910)", margin + 10, y);
      y += 5;
      pdf.text("CLASSIFICAÇÃO:", margin + 10, y);
      y += 4;
      pdf.setFontSize(7);
      pdf.text("□ MISSIONÁRIO (≥1496)   □ VOLUNTÁRIO (1232-1495)   □ APRENDIZ (≤1231)", margin + 12, y);

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
    { id: "criteria", name: "Critérios", icon: <Settings size={20} /> },
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
              Todos os clubes iniciam com 1.910 pontos (pontuação máxima). Durante o evento, perdem pontos conforme não atendem aos critérios.
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
        {filteredClubs?.map((club) => {
          console.log(`📊 AdminDashboard - Clube: ${club.name}`, {
            scores: club.scores,
            hasScores: !!club.scores,
            scoringCriteria: !!scoringCriteria
          });
          const totalScore = calculateTotalScore(club.scores);
          console.log(`📊 AdminDashboard - Resultado: ${club.name} = ${totalScore} pts`);
          
          return (
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
                  {totalScore.toLocaleString()} pts
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Classificação:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  club.classification === "MISSIONÁRIO" 
                    ? "bg-yellow-100 text-yellow-800"
                    : club.classification === "VOLUNTÁRIO"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-orange-100 text-orange-800"
                }`}>
                  {club.classification === "MISSIONÁRIO" ? (
                    <span className="flex items-center gap-1">
                      <Crown size={12} />
                      MISSIONÁRIO
                    </span>
                  ) : club.classification === "VOLUNTÁRIO" ? (
                    <span className="flex items-center gap-1">
                      <Trophy size={12} />
                      VOLUNTÁRIO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Star size={12} />
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
          );
        })}
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

    // Usar critérios do banco de dados - se não existir, usar estrutura vazia
    const criteriaToUse = scoringCriteria || {
      prerequisites: {},
      campground: {},
      kitchen: {},
      participation: {},
      uniform: {},
      secretary: {},
      events: {},
      bonus: {},
      demerits: {}
    };

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
                      <span className="text-sm text-gray-600">Quantidade:</span>
                      <input
                        type="number"
                        value={Math.abs(currentValue / 100) || 0}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value) || 0;
                          updateScore(category, key, -(quantity * 100));
                        }}
                        className={`w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-red-500 ${
                          isLocked ? 'bg-green-100 cursor-not-allowed' : ''
                        }`}
                        min={0}
                        placeholder="0"
                        disabled={isLocked}
                      />
                      <span className="text-sm font-medium text-red-600">
                        = {currentValue ? currentValue.toLocaleString() : 0} pts
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
          <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-4 rounded-lg">
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
                  {classification === "MISSIONÁRIO" ? (
                    <>
                      <Crown size={20} className="text-yellow-500" />
                      MISSIONÁRIO
                    </>
                  ) : classification === "VOLUNTÁRIO" ? (
                    <>
                      <Trophy size={20} className="text-blue-300" />
                      VOLUNTÁRIO
                    </>
                  ) : (
                    <>
                      <Star size={20} className="text-orange-500" />
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
              <Building2 size={20} />
              Área de Acampamento
            </span>, 
            "campground", criteriaToUse.campground, currentScores.campground
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <User size={20} />
              Cozinha
            </span>, 
            "kitchen", (criteriaToUse as any).kitchen, currentScores.kitchen
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Users size={20} />
              Participação
            </span>, 
            "participation", (criteriaToUse as any).participation, currentScores.participation
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Shield size={20} />
              Uniforme
            </span>, 
            "uniform", (criteriaToUse as any).uniform, currentScores.uniform
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <FileText size={20} />
              Secretaria
            </span>, 
            "secretary", (criteriaToUse as any).secretary, currentScores.secretary
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Star size={20} />
              Eventos/Provas
            </span>, 
            "events", (criteriaToUse as any).events, currentScores.events
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <Trophy size={20} />
              Bônus
            </span>, 
            "bonus", (criteriaToUse as any).bonus, currentScores.bonus
          )}
          {renderScoreSection(
            <span className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-red-700">Deméritos</span>
            </span>, 
            "demerits", (criteriaToUse as any).demerits, currentScores.demerits, true
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
    return selectedClub ? (
      <AdminScoringMobile
        selectedClub={selectedClub}
        editingScores={editingScores}
        scoringCriteria={scoringCriteria}
        adminEditMode={adminEditMode}
        lockingCriteria={lockingCriteria}
        onClose={() => {
          setSelectedClub(null);
          setEditingScores(null);
          setAdminEditMode(false);
          setActiveTab("clubs");
        }}
        onSave={handleSaveScores}
        onEnableEditMode={enableAdminEditMode}
        onSaveAdminChanges={saveAdminChanges}
        updateScore={updateScore}
        lockSingleCriteria={lockSingleCriteria}
        isCriteriaEvaluated={isCriteriaEvaluated}
        calculateTotalScore={calculateTotalScore}
        getClassification={getClassification}
      />
    ) : (
      <div className="space-y-6">
        {/* Toggle entre modos */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setEvaluationMode('individual')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              evaluationMode === 'individual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Modo Individual
          </button>
          <button
            onClick={() => setEvaluationMode('batch')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              evaluationMode === 'batch'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Modo em Lote
          </button>
        </div>

        {evaluationMode === 'batch' ? (
          // Modo de Avaliação em Lote
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-6 h-6" />
                <h3 className="text-xl font-bold">Avaliação em Lote</h3>
              </div>
              <p className="text-sm opacity-90">Avalie múltiplos clubes de uma só vez</p>
            </div>

            {/* Aviso sobre Sistema de Penalidades */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Sistema de Penalidades</h4>
                  <p className="text-sm text-yellow-700">
                    Todos os clubes iniciam com <strong>1910 pontos</strong>. 
                    A cada critério NÃO atendido ou atendido parcialmente, o clube <strong>PERDE pontos</strong>.
                    Avalie com atenção para aplicar a penalidade correta!
                  </p>
                </div>
              </div>
            </div>

            {/* Seleção de Categoria e Critério */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4" />
                  Selecione a Categoria
                </label>
                <select
                  value={batchCategory}
                  onChange={(e) => {
                    setBatchCategory(e.target.value);
                    setBatchCriterion('');
                    setSelectedClubsForBatch([]);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma categoria...</option>
                  {scoringCriteria && Object.keys(scoringCriteria).map((categoryKey) => (
                    <option key={categoryKey} value={categoryKey}>
                      {categoryKey === 'prerequisites' ? 'Pré-Requisitos' :
                       categoryKey === 'campground' ? 'Acampamento' :
                       categoryKey === 'kitchen' ? 'Cozinha' :
                       categoryKey === 'participation' ? 'Participação' :
                       categoryKey === 'uniform' ? 'Uniforme' :
                       categoryKey === 'secretary' ? 'Secretaria' :
                       categoryKey === 'events' ? 'Eventos' :
                       categoryKey === 'bonus' ? 'Bônus' :
                       categoryKey === 'demerits' ? 'Deméritos' : categoryKey}
                    </option>
                  ))}
                </select>
              </div>

              {batchCategory && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <ListChecks className="w-4 h-4" />
                    Selecione o Critério
                  </label>
                  <select
                    value={batchCriterion}
                    onChange={(e) => {
                      setBatchCriterion(e.target.value);
                      setSelectedClubsForBatch([]);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um critério...</option>
                    {scoringCriteria && batchCategory && scoringCriteria[batchCategory] && 
                      Object.entries(scoringCriteria[batchCategory]).map(([key, criterion]: [string, any]) => (
                        <option key={key} value={key}>
                          {criterion.description} (Max: {criterion.max} pts{criterion.partial ? `, Parcial: ${criterion.partial} pts` : ''})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Lista de Clubes Pendentes */}
            {batchCategory && batchCriterion && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CheckSquare className="w-4 h-4" />
                      Clubes Pendentes ({unevaluatedClubs?.length || 0})
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllUnevaluatedClubs}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Selecionar Todos
                      </button>
                      <button
                        onClick={clearClubSelection}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  {unevaluatedClubs && unevaluatedClubs.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-2 space-y-2">
                      {unevaluatedClubs.map((club) => (
                        <label
                          key={club._id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            selectedClubsForBatch.includes(club._id)
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedClubsForBatch.includes(club._id)}
                            onChange={() => toggleClubSelection(club._id)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{club.name}</p>
                            <p className="text-sm text-gray-500">{club.region}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-green-50 border-2 border-green-200 rounded-lg">
                      <CheckCircle size={48} className="mx-auto text-green-600 mb-2" />
                      <p className="text-green-800 font-medium">
                        Todos os clubes já foram avaliados neste critério!
                      </p>
                    </div>
                  )}
                </div>

                {selectedClubsForBatch.length > 0 && (
                  <>
                    {/* Tipo de Pontuação */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <BarChart2 className="w-4 h-4" />
                        Tipo de Pontuação
                      </label>
                      <div className="space-y-2">
                        {(() => {
                          const criterion = scoringCriteria && batchCategory && batchCriterion 
                            ? scoringCriteria[batchCategory]?.[batchCriterion]
                            : null;
                          
                          return (
                            <>
                              <label className="flex items-center gap-3 p-4 border-2 border-green-300 rounded-lg cursor-pointer hover:bg-green-50 transition-colors has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                                <input
                                  type="radio"
                                  name="scoreType"
                                  value="maximum"
                                  checked={batchScoreType === 'maximum'}
                                  onChange={(e) => setBatchScoreType(e.target.value as any)}
                                  className="w-5 h-5 text-green-600"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">✅ Atendeu 100% (Completo)</p>
                                  <p className="text-sm text-green-600">Não perde pontos - Pontuação máxima mantida</p>
                                </div>
                              </label>

                              {criterion?.partial && criterion.partial > 0 && (
                                <label className="flex items-center gap-3 p-4 border-2 border-yellow-300 rounded-lg cursor-pointer hover:bg-yellow-50 transition-colors has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-50">
                                  <input
                                    type="radio"
                                    name="scoreType"
                                    value="partial"
                                    checked={batchScoreType === 'partial'}
                                    onChange={(e) => setBatchScoreType(e.target.value as any)}
                                    className="w-5 h-5 text-yellow-600"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">⚠️ Atendeu Parcialmente</p>
                                    <p className="text-sm text-yellow-600">Perde {(criterion?.max || 0) - (criterion?.partial || 0)} pontos (de {criterion?.max} para {criterion?.partial})</p>
                                  </div>
                                </label>
                              )}

                              <label className="flex items-center gap-3 p-4 border-2 border-red-300 rounded-lg cursor-pointer hover:bg-red-50 transition-colors has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                                <input
                                  type="radio"
                                  name="scoreType"
                                  value="zero"
                                  checked={batchScoreType === 'zero'}
                                  onChange={(e) => setBatchScoreType(e.target.value as any)}
                                  className="w-5 h-5 text-red-600"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">❌ Não Atendeu</p>
                                  <p className="text-sm text-red-600">Perde {criterion?.max || 0} pontos (penalidade total)</p>
                                </div>
                              </label>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FileCheck className="w-4 h-4" />
                        Observações (opcional)
                      </label>
                      <textarea
                        value={batchNotes}
                        onChange={(e) => setBatchNotes(e.target.value)}
                        placeholder="Adicione observações sobre esta avaliação..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Botão de Avaliação */}
                    <button
                      onClick={handleBatchEvaluation}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02]"
                    >
                      Avaliar {selectedClubsForBatch.length} Clube(s) Selecionado(s)
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          // Modo Individual (mantém a interface atual)
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
                    club.classification === "MISSIONÁRIO" 
                      ? "bg-yellow-100 text-yellow-800"
                      : club.classification === "VOLUNTÁRIO"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-orange-100 text-orange-800"
                  }`}>
                    {club.classification === "MISSIONÁRIO" ? "MISSIONÁRIO" : 
                     club.classification === "VOLUNTÁRIO" ? "VOLUNTÁRIO" : 
                     "APRENDIZ"}
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
        )}
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
              <p className="text-yellow-600 text-sm font-medium">Clubes Missionários</p>
              <p className="text-2xl font-bold text-yellow-900">
                {classificationStats?.MISSIONÁRIO || 0}
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
              <div className="mb-2 text-yellow-600">
                <Crown size={32} className="mx-auto" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{classificationStats.MISSIONÁRIO}</div>
              <div className="text-sm text-gray-600">MISSIONÁRIO</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-blue-600">
                <Trophy size={32} className="mx-auto" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{classificationStats.VOLUNTÁRIO}</div>
              <div className="text-sm text-gray-600">VOLUNTÁRIO</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-orange-600">
                <Star size={32} className="mx-auto" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{classificationStats.APRENDIZ}</div>
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
                    <p className="text-2xl font-bold text-blue-900">{regionStats && Object.keys(regionStats).length || 0}</p>
                  </div>
                  <MapPin size={24} className="text-blue-600" />
                </div>
              </div>
              
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Região com Mais Clubes</p>
                    <p className="text-2xl font-bold text-green-900">
                      {regionStats && Object.keys(regionStats).length > 0 
                        ? Object.entries(regionStats).reduce((max, [region, stats]: [string, any]) => 
                            stats.total > (regionStats[max] ? regionStats[max].total : 0) ? region : max, Object.keys(regionStats)[0])
                        : '--'
                      }
                    </p>
                    <p className="text-xs text-green-600">
                      {regionStats && Object.keys(regionStats).length > 0 
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
                      {regionStats && Object.keys(regionStats).length > 0 
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
                    <p className="text-sm text-orange-700 font-medium">Total de Missionários</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {Object.keys(regionStats).length > 0 
                        ? Object.values(regionStats).reduce((sum: number, stats: any) => sum + (stats.classifications?.MISSIONÁRIO || 0), 0)
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
              {regionStats && Object.entries(regionStats)
                .sort(([a], [b]) => {
                  const numA = parseInt(a.replace('R', ''));
                  const numB = parseInt(b.replace('R', ''));
                  return numA - numB;
                })
                .map(([region, stats]: [string, any]) => {
                  const maxScore = Math.max(...Object.values(regionStats).map((s: any) => s.averageScore));
                  const scorePercentage = (stats.averageScore / maxScore) * 100;
                  const totalClubs = stats.total;
                  const missionarioPercentage = totalClubs > 0 ? (stats.classifications.MISSIONÁRIO / totalClubs) * 100 : 0;
                  const voluntarioPercentage = totalClubs > 0 ? (stats.classifications.VOLUNTÁRIO / totalClubs) * 100 : 0;
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
                            className="bg-gradient-to-r from-campori-navy to-campori-darkGreen h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${scorePercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Distribuição de Classificações */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Distribuição por Classificação</div>
                        
                        {/* Missionário */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Crown size={14} className="text-yellow-500" />
                            <span className="text-xs text-gray-600">Missionário</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-yellow-500 h-1.5 rounded-full"
                                style={{ width: `${missionarioPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium w-6 text-right">{stats.classifications.MISSIONÁRIO}</span>
                          </div>
                        </div>

                        {/* Voluntário */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy size={14} className="text-blue-500" />
                            <span className="text-xs text-gray-600">Voluntário</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${voluntarioPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium w-6 text-right">{stats.classifications.VOLUNTÁRIO}</span>
                          </div>
                        </div>

                        {/* Aprendiz */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star size={14} className="text-orange-500" />
                            <span className="text-xs text-gray-600">Aprendiz</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-orange-500 h-1.5 rounded-full"
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
              <div className="bg-gradient-to-r from-campori-navy to-campori-darkGreen text-white p-6 rounded-xl">
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
                    <div className="text-3xl font-bold">{regionStats ? Object.keys(regionStats).length : 0}</div>
                    <div className="text-blue-100 text-sm">Regiões Ativas</div>
                  </div>
                </div>

                {/* Estatísticas Rápidas do Ranking */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {regionStats && Object.keys(regionStats).length > 0 
                        ? Math.max(...Object.values(regionStats).map((s: any) => s.averageScore)).toLocaleString()
                        : '0'
                      }
                    </div>
                    <div className="text-white/80 text-xs">Maior Pontuação</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {regionStats && Object.keys(regionStats).length > 0 
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
                        ? Object.values(regionStats).reduce((sum: number, stats: any) => sum + (stats.classifications?.MISSIONÁRIO || 0), 0)
                        : 0
                      }
                    </div>
                    <div className="text-white/80 text-xs">Total de Missionários</div>
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
                            <div className="text-xs text-gray-500">{stats.classifications.MISSIONÁRIO} missionários</div>
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
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Missionário</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Voluntário</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aprendiz</th>
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

                              {/* Missionário */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Crown size={16} className="text-yellow-500" />
                                  <span className="font-semibold text-yellow-700">{(stats as any).classifications.MISSIONÁRIO}</span>
                                </div>
                              </td>

                              {/* Voluntário */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Trophy size={16} className="text-blue-500" />
                                  <span className="font-semibold text-blue-700">{(stats as any).classifications.VOLUNTÁRIO}</span>
                                </div>
                              </td>

                              {/* Aprendiz */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Star size={16} className="text-orange-500" />
                                  <span className="font-semibold text-orange-700">{(stats as any).classifications.APRENDIZ}</span>
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
                                className="bg-gradient-to-r from-campori-green to-campori-darkGreen h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
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
                    {regionStats && ['MISSIONÁRIO', 'VOLUNTÁRIO', 'APRENDIZ'].map((classification) => {
                      const total = Object.values(regionStats).reduce((sum: number, stats: any) => sum + stats.classifications[classification], 0);
                      const totalClubs = Object.values(regionStats).reduce((sum: number, stats: any) => sum + stats.total, 0);
                      const percentage = totalClubs > 0 ? (total / totalClubs) * 100 : 0;
                      
                      return (
                        <div key={classification} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {classification === 'MISSIONÁRIO' ? <Crown size={16} className="text-yellow-500" /> :
                               classification === 'VOLUNTÁRIO' ? <Trophy size={16} className="text-blue-500" /> :
                               <Star size={16} className="text-orange-500" />}
                              <span className="text-sm font-medium capitalize">
                                {classification.toLowerCase()}
                              </span>
                            </div>
                            <div className="text-sm font-bold">{total} ({percentage.toFixed(1)}%)</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                classification === 'MISSIONÁRIO' ? 'bg-yellow-500' :
                                classification === 'VOLUNTÁRIO' ? 'bg-blue-500' :
                                'bg-orange-500'
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
                        club.classification === "MISSIONÁRIO" 
                          ? "bg-yellow-100 text-yellow-800"
                          : club.classification === "VOLUNTÁRIO"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {club.classification}
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

  const renderUsers = () => {
    // Filtrar usuários baseado na busca
    const filteredUsers = users?.filter(u => {
      if (u.role === "admin") return false; // Não mostrar admin
      if (!userSearch) return true;
      
      const searchLower = userSearch.toLowerCase();
      const nameMatch = u.name.toLowerCase().includes(searchLower);
      const roleMatch = u.role.toLowerCase().includes(searchLower);
      const regionMatch = u.region?.toLowerCase().includes(searchLower);
      
      return nameMatch || roleMatch || regionMatch;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Usuários do Sistema</h2>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por nome, função ou região..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {userSearch && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-blue-800 text-sm">
              Mostrando {filteredUsers?.length || 0} de {users?.filter(u => u.role !== "admin").length || 0} usuários
              {userSearch && ` para "${userSearch}"`}
            </p>
          </div>
        )}

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
                {filteredUsers?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {userSearch ? "Nenhum usuário encontrado para a busca" : "Nenhum usuário cadastrado"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers?.map((userItem) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

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
                        {club.classification === "MISSIONÁRIO" ? (
                          <div className="flex items-center text-yellow-600 font-medium">
                            <Crown size={16} className="mr-1" />
                            MISSIONÁRIO
                          </div>
                        ) : club.classification === "VOLUNTÁRIO" ? (
                          <div className="flex items-center text-blue-600 font-medium">
                            <Trophy size={16} className="mr-1" />
                            VOLUNTÁRIO
                          </div>
                        ) : (
                          <div className="flex items-center text-orange-600 font-medium">
                            <Star size={16} className="mr-1" />
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
    const categories = [
      { 
        id: 'prerequisites', 
        name: 'Pré-requisitos', 
        icon: <ClipboardList size={24} />,
        color: 'bg-green-50 border-green-300',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600'
      },
      { 
        id: 'campground', 
        name: 'Área de Acampamento', 
        icon: <Building2 size={24} />,
        color: 'bg-orange-50 border-orange-300',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600'
      },
      { 
        id: 'kitchen', 
        name: 'Cozinha', 
        icon: <ChefHat size={24} />,
        color: 'bg-purple-50 border-purple-300',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600'
      },
      { 
        id: 'participation', 
        name: 'Participação', 
        icon: <Users size={24} />,
        color: 'bg-blue-50 border-blue-300',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600'
      },
      { 
        id: 'uniform', 
        name: 'Uniforme', 
        icon: <Shield size={24} />,
        color: 'bg-indigo-50 border-indigo-300',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600'
      },
      { 
        id: 'secretary', 
        name: 'Secretaria', 
        icon: <FileText size={24} />,
        color: 'bg-teal-50 border-teal-300',
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600'
      },
      { 
        id: 'events', 
        name: 'Provas', 
        icon: <Trophy size={24} />,
        color: 'bg-yellow-50 border-yellow-300',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600'
      },
      { 
        id: 'bonus', 
        name: 'Bônus', 
        icon: <Star size={24} />,
        color: 'bg-pink-50 border-pink-300',
        iconBg: 'bg-pink-100',
        iconColor: 'text-pink-600'
      },
      { 
        id: 'demerits', 
        name: 'Deméritos', 
        icon: <AlertTriangle size={24} />,
        color: 'bg-red-50 border-red-300',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600'
      }
    ];

    const openCreateModal = (categoryId: string) => {
      setScoringSelectedCategory(categoryId);
      setScoringModalMode('create');
      setScoringFormData({ key: '', description: '', max: 0, partial: 0 });
      setShowScoringModal(true);
    };

    const openEditModal = (categoryId: string, criterionKey: string, criterion: any) => {
      setScoringSelectedCategory(categoryId);
      setScoringModalMode('edit');
      setEditingCriterionKey(criterionKey);
      setScoringFormData({
        key: criterionKey,
        description: criterion.description,
        max: criterion.max || 0,
        partial: criterion.partial || 0
      });
      setShowScoringModal(true);
    };

    const handleSaveCriterion = async () => {
      if (!scoringFormData.description || !scoringSelectedCategory) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      if (scoringModalMode === 'create' && !scoringFormData.key) {
        toast.error("A chave do requisito é obrigatória");
        return;
      }

      try {
        if (scoringModalMode === 'create') {
          await createScoringCriterion({
            category: scoringSelectedCategory,
            key: scoringFormData.key,
            description: scoringFormData.description,
            max: scoringFormData.max,
            partial: scoringFormData.partial,
            adminId: user._id,
          });
          toast.success('Requisito criado com sucesso!');
        } else {
          await updateScoringCriterion({
            category: scoringSelectedCategory,
            key: editingCriterionKey,
            description: scoringFormData.description,
            max: scoringFormData.max,
            partial: scoringFormData.partial,
            adminId: user._id,
          });
          toast.success('Requisito atualizado com sucesso!');
        }
        setShowScoringModal(false);
      } catch (error: any) {
        toast.error(error.message);
      }
    };

    const handleResetCriteria = async () => {
      if (confirm('Tem certeza que deseja resetar todos os requisitos para os valores padrões?')) {
        try {
          await resetScoringCriteria({ adminId: user._id });
          toast.success('Requisitos resetados para valores padrões!');
        } catch (error: any) {
          toast.error(error.message);
        }
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Sistema de Pontuação - XXI Campori Paulistana</h2>
        </div>

        {/* Banner Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center">
            <Info size={16} className="text-blue-600 mr-2" />
            <div className="text-blue-800">
              <p className="font-medium">XXI Campori Paulistana - "Até os Confins da Terra"</p>
              <p className="text-sm">
                Sistema de pontuação oficial com 1.910 pontos totais. Classificações: MISSIONÁRIO (≥1496), VOLUNTÁRIO (1232-1495), APRENDIZ (≤1231).
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const categoryData = scoringCriteria?.[category.id] || {};
            const criteriaCount = Object.keys(categoryData).length;
            const totalPoints = Object.values(categoryData).reduce((sum: number, item: any) => 
              sum + (item.max || 0), 0
            );

            return (
              <div key={category.id} className={`${category.color} border-2 rounded-xl p-5 hover:shadow-md transition-all`}>
                {/* Header do Card */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${category.iconBg} p-3 rounded-lg`}>
                    <span className={category.iconColor}>{category.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-600">
                      {criteriaCount} {criteriaCount === 1 ? 'requisito' : 'requisitos'} • {totalPoints} pts
                    </p>
                  </div>
                </div>

                {/* Lista de Requisitos */}
                <div className="space-y-2 mb-4 min-h-[100px]">
                  {criteriaCount === 0 ? (
                    <div className="bg-white/60 p-4 rounded-lg text-center border-2 border-dashed border-gray-300">
                      <p className="text-gray-500 text-sm mb-2">Nenhum requisito cadastrado</p>
                      <button
                        onClick={() => setActiveTab('criteria')}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                      >
                        Ir para aba Critérios →
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {Object.entries(categoryData).map(([key, criterion]: [string, any]) => (
                        <div key={key} className="bg-white/60 p-3 rounded-lg text-sm border border-gray-200 hover:border-blue-300 transition-all">
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <p className="text-gray-800 flex-1 font-medium">{criterion.description}</p>
                            <button
                              onClick={() => openEditModal(category.id, key, criterion)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors flex-shrink-0"
                              title="Editar requisito"
                            >
                              <Settings size={16} />
                            </button>
                          </div>
                          <p className="text-gray-600 text-xs">
                            Max: <span className="font-semibold">{criterion.max}pts</span>
                            {criterion.partial > 0 && (
                              <> • Parcial: <span className="font-semibold">{criterion.partial}pts</span></>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal de Criar/Editar */}
        {showScoringModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {scoringModalMode === 'create' ? 'Novo Requisito' : 'Editar Requisito'}
                </h3>
                <button
                  onClick={() => setShowScoringModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={categories.find(c => c.id === scoringSelectedCategory)?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                {/* Key (somente na criação) */}
                {scoringModalMode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chave (identificador único) *
                    </label>
                    <input
                      type="text"
                      value={scoringFormData.key}
                      onChange={(e) => setScoringFormData({...scoringFormData, key: e.target.value})}
                      placeholder="ex: directorPresence"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use camelCase sem espaços</p>
                  </div>
                )}

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    value={scoringFormData.description}
                    onChange={(e) => setScoringFormData({...scoringFormData, description: e.target.value})}
                    placeholder="Descreva o requisito..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Pontuação Máxima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pontuação Máxima *
                  </label>
                  <input
                    type="number"
                    value={scoringFormData.max}
                    onChange={(e) => setScoringFormData({...scoringFormData, max: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Pontuação Parcial */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pontuação Parcial (opcional)
                  </label>
                  <input
                    type="number"
                    value={scoringFormData.partial}
                    onChange={(e) => setScoringFormData({...scoringFormData, partial: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowScoringModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCriterion}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
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
            <h4 className="font-semibold text-green-700 mb-2">Inicialização e Correções</h4>
            <p className="text-sm text-gray-600 mb-3">
              Ferramentas para resetar pontuação dos clubes e corrigir dados inconsistentes de avaliações antigas.
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
              <button
                onClick={async () => {
                  if (!confirm('Isso vai corrigir os clubes que foram avaliados em lote antes da atualização e estão mostrando 0 pontos. Continuar?')) return;
                  try {
                    toast.info('Migrando dados antigos...');
                    const result = await migrateOldBatchEvaluations({});
                    toast.success(`Migração concluída! ${result.clubsMigrated} clubes corrigidos de ${result.totalClubsChecked} verificados.`);
                  } catch (error: any) {
                    toast.error(`Erro na migração: ${error.message}`);
                  }
                }}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Corrigir Avaliações Antigas
              </button>
              <button
                onClick={handleImportClubs}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm flex items-center justify-center gap-2"
              >
                📥 Importar Clubes (JSON)
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
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {classificationStats?.MISSIONÁRIO || 0}
            </div>
            <div className="text-sm text-yellow-800">Clubes Missionários</div>
          </div>
        </div>
      </div>

      {/* Informações sobre o Sistema Aditivo */}
      <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
          <Lightbulb size={20} />
          Sistema de Pontuação por Dedução
        </h3>
        <div className="space-y-3 text-green-800">
          <p className="text-sm">
            <strong>Funcionamento:</strong> Todos os clubes iniciam com 1.910 pontos (pontuação máxima).
          </p>
          <p className="text-sm">
            <strong>Durante o evento:</strong> Pontos são deduzidos conforme os clubes não atendem aos critérios estabelecidos.
          </p>
          <p className="text-sm">
            <strong>Objetivo:</strong> Incentivar os clubes a atenderem o máximo de critérios possível para manter a pontuação alta.
          </p>
        </div>
      </div>

      {/* Seção de Logs Detalhados de Avaliação */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <ClipboardList size={20} />
              Logs Detalhados de Avaliações
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Histórico completo de todas as avaliações realizadas pelo staff
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
          {evaluationLogs && evaluationLogs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {evaluationLogs.map((log: any) => {
                // Processar detalhes do log para melhor formatação
                const details = log.details.split('\n').filter((line: string) => line.trim());
                const criteriaLines = details.filter((line: string) => line.includes('📊 Critério:'));
                const summaryLine = details.find((line: string) => line.includes('📊 Penalidade Total:'));
                
                return (
                  <div key={log._id} className="p-4 hover:bg-gray-50 transition-colors border-l-4 border-purple-500">
                    {/* Cabeçalho do log */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <UserCheck size={20} className="text-purple-600" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{log.userName}</span>
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-medium">
                              {log.userRole === 'admin' ? '👑 Admin' :
                               log.userRole === 'regional' ? '🗺️ Regional' :
                               '⭐ Staff'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="text-gray-600">avaliou</span>
                            <span className="font-semibold text-blue-600">{log.clubName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold text-gray-900">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-gray-600 font-medium">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Critérios avaliados */}
                    {criteriaLines.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Critérios Avaliados
                        </h4>
                        <div className="space-y-1.5">
                          {criteriaLines.map((line: string, idx: number) => {
                            // Extrair informações da linha
                            const match = line.match(/📊 Critério: (.+?) \| Ganhou: (\d+)\/(\d+) \| Penalidade: (\d+)/);
                            if (!match) return null;
                            
                            const [, criterion, earned, max, penalty] = match;
                            const earnedNum = parseInt(earned);
                            const maxNum = parseInt(max);
                            const penaltyNum = parseInt(penalty);
                            const percentage = maxNum > 0 ? (earnedNum / maxNum) * 100 : 0;
                            
                            // Mapear nomes das categorias
                            const categoryNames: Record<string, string> = {
                              'prerequisites': 'Pré-requisitos',
                              'campground': 'Área de Acampamento',
                              'kitchen': 'Cozinha',
                              'participation': 'Participação',
                              'uniform': 'Uniforme',
                              'secretary': 'Secretaria',
                              'events': 'Eventos/Provas',
                              'bonus': 'Bônus',
                              'demerits': 'Deméritos'
                            };
                            
                            return (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-700 mb-1.5 break-words">
                                      {criterion.split('.').map((part: string, i: number) => (
                                        <span key={i}>
                                          {i > 0 && <span className="text-gray-400 mx-1">›</span>}
                                          <span className={i === 0 ? 'text-blue-600 font-semibold' : ''}>
                                            {i === 0 ? (categoryNames[part] || part) : part.replace(/_/g, ' ')}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                    
                                    {/* Barra de progresso */}
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                      <div
                                        className={`h-1.5 rounded-full transition-all ${
                                          percentage === 100 ? 'bg-green-500' :
                                          percentage >= 50 ? 'bg-blue-500' :
                                          'bg-red-500'
                                        }`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className={`font-semibold ${
                                        earnedNum === maxNum ? 'text-green-600' :
                                        earnedNum > 0 ? 'text-blue-600' :
                                        'text-red-600'
                                      }`}>
                                        {earnedNum === maxNum ? '✓' : earnedNum > 0 ? '◐' : '✗'} {earned}/{max} pontos
                                      </span>
                                      {penaltyNum > 0 && (
                                        <span className="text-red-600 font-semibold">
                                          -{penalty} pts penalidade
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Badge de status */}
                                  <div className="flex-shrink-0">
                                    {earnedNum === maxNum ? (
                                      <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                                        100%
                                      </div>
                                    ) : earnedNum > 0 ? (
                                      <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                        {Math.round(percentage)}%
                                      </div>
                                    ) : (
                                      <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                                        0%
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

                    {/* Resumo final */}
                    {summaryLine && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <Trophy size={20} className="text-white" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 font-medium mb-1">RESULTADO FINAL</div>
                              {(() => {
                                const match = summaryLine.match(/📊 Penalidade Total: (\d+) \| Pontuação Final: (\d+)/);
                                if (!match) return null;
                                const [, totalPenalty, finalScore] = match;
                                
                                return (
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <span className="text-xs text-gray-600">Penalidade Total:</span>
                                      <div className="text-lg font-bold text-red-600">-{totalPenalty} pts</div>
                                    </div>
                                    <div className="w-px h-10 bg-gray-300"></div>
                                    <div>
                                      <span className="text-xs text-gray-600">Pontuação Final:</span>
                                      <div className="text-2xl font-bold text-blue-600">{finalScore} pts</div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <ClipboardList size={48} className="mx-auto mb-3 text-gray-400" />
              <p>Nenhuma avaliação detalhada registrada ainda</p>
            </div>
          )}
        </div>
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
      case "criteria":
        return <CriteriaManager user={user} />;
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
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-campori-navy to-campori-darkGreen shadow-xl z-50 backdrop-blur-sm">
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
}
