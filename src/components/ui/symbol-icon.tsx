import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  BarChart3,
  BookMarked,
  BookOpen,
  Brain,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Dumbbell,
  Eye,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  Handshake,
  History,
  Landmark,
  Layers,
  Lightbulb,
  List,
  Lock,
  Mail,
  Menu,
  PlayCircle,
  RotateCcw,
  Rocket,
  Ruler,
  Search,
  Settings2,
  Shield,
  Smile,
  Sparkles,
  Terminal,
  TrendingUp,
  User,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const icons = {
  analytics: BarChart3,
  architecture: Landmark,
  arrow_forward: ArrowRight,
  auto_stories: BookMarked,
  bolt: Zap,
  build: Wrench,
  check_circle: CheckCircle2,
  construction: Wrench,
  conversion_path: Activity,
  description: FileText,
  error: AlertCircle,
  fact_check: ClipboardCheck,
  filter_list: Filter,
  fitness_center: Dumbbell,
  flare: Sparkles,
  format_list_bulleted: List,
  handshake: Handshake,
  history: History,
  history_edu: BookMarked,
  interactive_space: Activity,
  layers: Layers,
  lightbulb: Lightbulb,
  lock: Lock,
  mail: Mail,
  menu: Menu,
  menu_book: BookOpen,
  monitoring: Activity,
  play_circle: PlayCircle,
  person: User,
  psychology: Brain,
  query_stats: BarChart3,
  quiz: CircleHelp,
  restart_alt: RotateCcw,
  rocket_launch: Rocket,
  school: GraduationCap,
  search: Search,
  sentiment_satisfied: Smile,
  settings_ethernet: Settings2,
  shield: Shield,
  speed: Gauge,
  straighten: Ruler,
  swap_vert: ArrowUpDown,
  tactic: Search,
  terminal: Terminal,
  trending_up: TrendingUp,
  verified: BadgeCheck,
  visibility: Eye,
} satisfies Record<string, LucideIcon>;

export type SymbolIconName = keyof typeof icons;

export function SymbolIcon({
  name,
  className,
}: {
  name: SymbolIconName | string;
  className?: string;
}) {
  const Icon = icons[name as SymbolIconName] ?? CircleHelp;

  return (
    <Icon
      aria-hidden="true"
      className={cn("inline-block h-[1em] w-[1em] shrink-0 align-[-0.125em]", className)}
      strokeWidth={2}
    />
  );
}
