export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users_settings: {
        Row: {
          id: string
          hourly_rate: number
          token_price: number
          currency: string
          display_mode: 'simple' | 'advanced'
          theme: 'dark' | 'light'
          subscription_plan: 'free' | 'pro' | 'enterprise'
          projects_limit: number | null
          collaborators_limit: number | null
          subscription_started_at: string | null
          subscription_ends_at: string | null
          subscription_cancelled_at: string | null
          stripe_customer_id: string | null
          mobile_money_number: string | null
          is_admin: boolean
          stats_period_type: 'calendar' | 'rolling'
          show_kpis: boolean  // ← NOUVEAU
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          hourly_rate?: number
          token_price?: number
          currency?: string
          display_mode?: 'simple' | 'advanced'
          theme?: 'dark' | 'light'
          subscription_plan?: 'free' | 'pro' | 'enterprise'
          projects_limit?: number | null
          collaborators_limit?: number | null
          subscription_started_at?: string | null
          subscription_ends_at?: string | null
          subscription_cancelled_at?: string | null
          stripe_customer_id?: string | null
          mobile_money_number?: string | null
          is_admin?: boolean
          stats_period_type?: 'calendar' | 'rolling'
          show_kpis?: boolean  // ← NOUVEAU
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hourly_rate?: number
          token_price?: number
          currency?: string
          display_mode?: 'simple' | 'advanced'
          theme?: 'dark' | 'light'
          subscription_plan?: 'free' | 'pro' | 'enterprise'
          projects_limit?: number | null
          collaborators_limit?: number | null
          subscription_started_at?: string | null
          subscription_ends_at?: string | null
          subscription_cancelled_at?: string | null
          stripe_customer_id?: string | null
          mobile_money_number?: string | null
          is_admin?: boolean
          stats_period_type?: 'calendar' | 'rolling'
          show_kpis?: boolean  // ← NOUVEAU
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          status: 'idea' | 'development' | 'paused' | 'deployed' | 'archived' | 'abandoned'
          visibility: 'private' | 'shared' | 'public'
          bugs_visible: boolean
          development_plan: string | null
          plan_updated_at: string | null
          reference: string | null
          dev_account: string
          dev_link: string
          deploy_link: string
          old_access_link: string
          github_link: string
          db_connected: boolean
          general_observations: string
          other_observations: string
          show_kpis: boolean | null  // ← NOUVEAU
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          status?: 'idea' | 'development' | 'paused' | 'deployed' | 'archived' | 'abandoned'
          visibility?: 'private' | 'shared' | 'public'
          bugs_visible?: boolean
          development_plan?: string | null
          plan_updated_at?: string | null
          reference?: string | null
          dev_account?: string
          dev_link?: string
          deploy_link?: string
          old_access_link?: string
          github_link?: string
          db_connected?: boolean
          general_observations?: string
          other_observations?: string
          show_kpis?: boolean | null  // ← NOUVEAU
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          status?: 'idea' | 'development' | 'paused' | 'deployed' | 'archived' | 'abandoned'
          visibility?: 'private' | 'shared' | 'public'
          bugs_visible?: boolean
          development_plan?: string | null
          plan_updated_at?: string | null
          reference?: string | null
          dev_account?: string
          dev_link?: string
          deploy_link?: string
          old_access_link?: string
          github_link?: string
          db_connected?: boolean
          general_observations?: string
          other_observations?: string
          show_kpis?: boolean | null  // ← NOUVEAU
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          project_id: string
          date: string
          title: string | null
          activities_summary: string | null
          general_observation: string | null
          reference: string | null
          time_bolt: number
          time_chatgpt: number
          time_deepseek: number
          time_other: number
          other_tool_name: string
          tokens_consumed: number
          deployment_status: 'ok' | 'nok'
          observations: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          date?: string
          title?: string | null
          activities_summary?: string | null
          general_observation?: string | null
          reference?: string | null
          time_bolt?: number
          time_chatgpt?: number
          time_deepseek?: number
          time_other?: number
          other_tool_name?: string
          tokens_consumed?: number
          deployment_status?: 'ok' | 'nok'
          observations?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          date?: string
          title?: string | null
          activities_summary?: string | null
          general_observation?: string | null
          reference?: string | null
          time_bolt?: number
          time_chatgpt?: number
          time_deepseek?: number
          time_other?: number
          other_tool_name?: string
          tokens_consumed?: number
          deployment_status?: 'ok' | 'nok'
          observations?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_shares: {
        Row: {
          id: string
          project_id: string
          invited_email: string
          role: 'viewer' | 'editor'
          added_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          invited_email: string
          role?: 'viewer' | 'editor'
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          invited_email?: string
          role?: 'viewer' | 'editor'
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bug_reports: {
        Row: {
          id: string
          project_id: string
          session_id: string | null
          title: string
          description: string
          category: 'ui' | 'api' | 'database' | 'logic' | 'performance' | 'security' | 'other'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          difficulty: number | null
          environment: 'development' | 'staging' | 'production'
          browser: string | null
          device: string | null
          app_version: string | null
          steps_taken: string | null
          hypothesis_tested: string | null
          solution: string | null
          resources_links: string[] | null
          estimated_time_minutes: number
          actual_time_minutes: number
          resolved_at: string | null
          attachments: Json
          tags: string[] | null
          specific_observations: string | null
          reference: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          session_id?: string | null
          title: string
          description: string
          category?: 'ui' | 'api' | 'database' | 'logic' | 'performance' | 'security' | 'other'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          difficulty?: number | null
          environment?: 'development' | 'staging' | 'production'
          browser?: string | null
          device?: string | null
          app_version?: string | null
          steps_taken?: string | null
          hypothesis_tested?: string | null
          solution?: string | null
          resources_links?: string[] | null
          estimated_time_minutes?: number
          actual_time_minutes?: number
          resolved_at?: string | null
          attachments?: Json
          tags?: string[] | null
          specific_observations?: string | null
          reference?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          session_id?: string | null
          title?: string
          description?: string
          category?: 'ui' | 'api' | 'database' | 'logic' | 'performance' | 'security' | 'other'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          difficulty?: number | null
          environment?: 'development' | 'staging' | 'production'
          browser?: string | null
          device?: string | null
          app_version?: string | null
          steps_taken?: string | null
          hypothesis_tested?: string | null
          solution?: string | null
          resources_links?: string[] | null
          estimated_time_minutes?: number
          actual_time_minutes?: number
          resolved_at?: string | null
          attachments?: Json
          tags?: string[] | null
          specific_observations?: string | null
          reference?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      project_stats: {
        Row: {
          id: string
          user_id: string
          name: string
          status: string
          total_time_minutes: number
          total_tokens: number
          session_count: number
          successful_deployments: number
          last_session_date: string | null
        }
      }
    }
  }
}

export type UserSettings = Database['public']['Tables']['users_settings']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type ProjectShare = Database['public']['Tables']['project_shares']['Row']
export type ProjectStats = Database['public']['Views']['project_stats']['Row']
export type BugReport = Database['public']['Tables']['bug_reports']['Row']

export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type BugCategory = 'ui' | 'api' | 'database' | 'logic' | 'performance' | 'security' | 'other'
export type BugEnvironment = 'development' | 'staging' | 'production'

export const BugStatusLabels: Record<BugStatus, string> = {
  open: '🔴 Ouvert',
  in_progress: '🟡 En cours',
  resolved: '🟢 Résolu',
  closed: '⚪ Fermé'
}

export const BugCategoryLabels: Record<BugCategory, string> = {
  ui: '🎨 UI/UX',
  api: '🔌 API',
  database: '🗄️ Base de données',
  logic: '⚙️ Logique métier',
  performance: '⚡ Performance',
  security: '🔒 Sécurité',
  other: '📦 Autre'
}

export const BugEnvironmentLabels: Record<BugEnvironment, string> = {
  development: '💻 Développement',
  staging: '🧪 Préproduction',
  production: '🚀 Production'
}

export const BugDifficultyLabels: Record<number, string> = {
  1: '😊 Facile',
  2: '🤔 Moyen',
  3: '😓 Difficile',
  4: '💀 Très difficile',
  5: '🔥 Extrême'
}