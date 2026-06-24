// =============================================
// MEDIUM AUTO PUBLISHER — Shared Types
// =============================================

// --- Enums (mirrored from Prisma) ---
export type Role = 'USER' | 'ADMIN';
export type TopicSource = 'MANUAL' | 'GOOGLE_TRENDS' | 'REDDIT' | 'HACKER_NEWS' | 'TWITTER' | 'DEV_TO' | 'RSS';
export type TopicStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
export type BlogMode = 'TECHNICAL_DEEP_DIVE' | 'TUTORIAL' | 'OPINION_PIECE' | 'CASE_STUDY' | 'THOUGHT_LEADERSHIP' | 'STARTUP_ANALYSIS';
export type BlogTone = 'PROFESSIONAL' | 'CASUAL' | 'FOUNDER' | 'EDUCATOR' | 'TECHNICAL_EXPERT';
export type BlogStatus = 'DRAFT' | 'RESEARCHING' | 'GENERATING' | 'HUMANIZING' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
export type ScheduleStatus = 'PENDING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

// --- User Types ---
export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  mediumUserId?: string;
  mediumUsername?: string;
  avatar?: string;
  createdAt: Date;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// --- Topic Types ---
export interface Topic {
  id: string;
  title: string;
  description?: string;
  source: TopicSource;
  popularityScore: number;
  category?: string;
  keywordDifficulty: number;
  engagementScore: number;
  keywords: string[];
  status: TopicStatus;
  userId: string;
  research?: Research;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTopicDto {
  title: string;
  description?: string;
  source?: TopicSource;
  category?: string;
  keywords?: string[];
}

export interface UpdateTopicDto extends Partial<CreateTopicDto> {
  status?: TopicStatus;
}

// --- Research Types ---
export interface Research {
  id: string;
  topicId: string;
  whatIsIt: string;
  whyItMatters: string;
  currentTrends: string;
  statistics: StatisticEntry[];
  realExamples: Example[];
  faqs: FAQ[];
  gaps: string[];
  references: Reference[];
  contrarian?: string;
  competingUrls: string[];
  keyInsights: string[];
  rawNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatisticEntry {
  fact: string;
  source?: string;
  year?: number;
}

export interface Example {
  company?: string;
  description: string;
  outcome?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Reference {
  title: string;
  url?: string;
  author?: string;
}

// --- Blog Types ---
export interface Blog {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: string;
  markdownContent: string;
  metaDescription?: string;
  tags: string[];
  category?: string;
  mode: BlogMode;
  tone: BlogTone;
  status: BlogStatus;
  wordCount: number;
  readTimeMinutes: number;
  complexityScore: number;
  aiProbabilityScore?: number;
  burstinessScore?: number;
  lexicalRichness?: number;
  readabilityScore?: number;
  focusKeyword?: string;
  coverImageUrl?: string;
  coverImagePrompts: string[];
  coverImageVariants: string[];
  outline?: BlogOutline;
  topicId?: string;
  userId: string;
  versions?: BlogVersion[];
  publishedPost?: PublishedPost;
  analytics?: Analytics[];
  internalLinkSuggestions: InternalLinkSuggestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogOutline {
  title: string;
  subtitle: string;
  sections: OutlineSection[];
  estimatedWordCount: number;
}

export interface OutlineSection {
  heading: string;
  level: 2 | 3;
  keyPoints: string[];
  targetWords: number;
  type: 'intro' | 'main' | 'example' | 'faq' | 'conclusion' | 'cta';
}

export interface CreateBlogDto {
  title?: string;
  topicId?: string;
  mode?: BlogMode;
  tone?: BlogTone;
  tags?: string[];
  category?: string;
  focusKeyword?: string;
}

export interface UpdateBlogDto {
  title?: string;
  subtitle?: string;
  content?: string;
  markdownContent?: string;
  metaDescription?: string;
  tags?: string[];
  category?: string;
  mode?: BlogMode;
  tone?: BlogTone;
  status?: BlogStatus;
  focusKeyword?: string;
}

// --- Blog Version ---
export interface BlogVersion {
  id: string;
  blogId: string;
  content: string;
  markdownContent: string;
  version: number;
  changeNote?: string;
  wordCount: number;
  createdAt: Date;
}

// --- Published Post ---
export interface PublishedPost {
  id: string;
  blogId: string;
  mediumId?: string;
  mediumUrl?: string;
  publishedAt: Date;
  platform: 'MEDIUM';
}

// --- Analytics Types ---
export interface Analytics {
  id: string;
  blogId: string;
  views: number;
  reads: number;
  readRatio: number;
  claps: number;
  followers: number;
  earnings: number;
  date: Date;
}

export interface DashboardStats {
  totalBlogs: number;
  draftBlogs: number;
  publishedBlogs: number;
  scheduledBlogs: number;
  totalViews: number;
  totalEarnings: number;
  totalReads: number;
  avgReadRatio: number;
}

export interface DashboardChartData {
  dailyViews: ChartDataPoint[];
  monthlyEarnings: ChartDataPoint[];
  blogsByStatus: PieChartData[];
  topBlogs: TopBlogData[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface TopBlogData {
  id: string;
  title: string;
  views: number;
  earnings: number;
  readRatio: number;
}

// --- Playlist Types ---
export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  category?: string;
  isPublished: boolean;
  totalReadTime: number;
  blogs: PlaylistBlog[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistBlog {
  id: string;
  playlistId: string;
  blogId: string;
  blog: Blog;
  order: number;
}

export interface CreatePlaylistDto {
  title: string;
  description?: string;
  category?: string;
}

// --- Schedule Types ---
export interface Schedule {
  id: string;
  blogId: string;
  blog?: Blog;
  scheduledAt: Date;
  status: ScheduleStatus;
  publishedAt?: Date;
  errorMessage?: string;
}

export interface CreateScheduleDto {
  blogId: string;
  scheduledAt: string;
}

// --- Internal Link Types ---
export interface InternalLinkSuggestion {
  targetBlogId: string;
  targetBlogTitle: string;
  anchorText: string;
  context: string;
  relevanceScore: number;
}

// --- AI Pipeline Types ---
export interface AIGenerationJob {
  jobId: string;
  topicId: string;
  blogId: string;
  mode: BlogMode;
  tone: BlogTone;
  userId: string;
  stage: PipelineStage;
  progress: number; // 0-100
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
}

export type PipelineStage =
  | 'research'
  | 'outline'
  | 'writing'
  | 'humanizing'
  | 'editing'
  | 'seo'
  | 'cover_image'
  | 'complete';

export interface ContentQualityMetrics {
  wordCount: number;
  readTimeMinutes: number;
  aiProbabilityScore: number; // 0-100, lower is better
  burstinessScore: number;    // higher is more human-like
  repetitionScore: number;    // lower is better
  lexicalRichness: number;    // higher is better
  readabilityScore: number;   // Flesch reading ease
  paragraphVariance: number;
  passesQualityCheck: boolean;
  failureReasons?: string[];
}

// --- Medium API Types ---
export interface MediumPublishDto {
  blogId: string;
  publishStatus?: 'public' | 'draft' | 'unlisted';
  tags?: string[];
  canonicalUrl?: string;
  license?: 'all-rights-reserved' | 'cc-40-by' | 'cc-40-by-sa' | 'cc-40-by-nd' | 'cc-40-by-nc' | 'cc-40-by-nc-nd' | 'cc-40-by-nc-sa' | 'cc-40-zero' | 'public-domain';
}

export interface MediumPublishResponse {
  id: string;
  title: string;
  authorId: string;
  url: string;
  canonicalUrl: string;
  publishStatus: string;
  publishedAt: number;
  tags: string[];
}

// --- API Response Wrapper ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// --- Cover Image ---
export interface CoverImageVariant {
  url: string;
  style: string;
  prompt: string;
  selected: boolean;
}
