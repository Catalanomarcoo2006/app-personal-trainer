
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "ai_messages": {
                  Row: {
                    "client_id": string,"content": string,"created_at": string,"id": string,"role": Database["public"]['Enums']["ai_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"content": string,"created_at"?: string,"id"?: string,"role": Database["public"]['Enums']["ai_role"]
                  }
                  Update: {
                    "client_id"?: string,"content"?: string,"created_at"?: string,"id"?: string,"role"?: Database["public"]['Enums']["ai_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_messages_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"alerts": {
                  Row: {
                    "client_id": string | null,"created_at": string,"id": string,"kind": Database["public"]['Enums']["alert_kind"],"read": boolean,"text": string,"trainer_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["alert_kind"],"read"?: boolean,"text": string,"trainer_id": string
                  }
                  Update: {
                    "client_id"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["alert_kind"],"read"?: boolean,"text"?: string,"trainer_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alerts_client_id_trainer_id_fkey"
      columns: ["client_id","trainer_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id","trainer_id"]
    },{
      foreignKeyName: "alerts_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "trainers"
      referencedColumns: ["id"]
    }
                  ]
                },"change_requests": {
                  Row: {
                    "client_id": string,"created_at": string,"id": string,"message": string,"session_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"id"?: string,"message": string,"session_id": string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"id"?: string,"message"?: string,"session_id"?: string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "change_requests_session_id_client_id_fkey"
      columns: ["session_id","client_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id","client_id"]
    }
                  ]
                },"clients": {
                  Row: {
                    "consent_at": string | null,"created_at": string,"email": string | null,"gender": string | null,"goal_current": number | null,"goal_label": string,"goal_proposed_start": number | null,"goal_proposed_target": number | null,"goal_start": number | null,"goal_target": number | null,"goal_unit": string,"id": string,"name": string,"notes": string,"phone": string | null,"status": Database["public"]['Enums']["client_status"],"tone": string,"trainer_id": string,"user_id": string | null,"weigh_frequency": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "consent_at"?: string | null,"created_at"?: string,"email"?: string | null,"gender"?: string | null,"goal_current"?: number | null,"goal_label"?: string,"goal_proposed_start"?: number | null,"goal_proposed_target"?: number | null,"goal_start"?: number | null,"goal_target"?: number | null,"goal_unit"?: string,"id"?: string,"name": string,"notes"?: string,"phone"?: string | null,"status"?: Database["public"]['Enums']["client_status"],"tone"?: string,"trainer_id": string,"user_id"?: string | null,"weigh_frequency"?: string | null
                  }
                  Update: {
                    "consent_at"?: string | null,"created_at"?: string,"email"?: string | null,"gender"?: string | null,"goal_current"?: number | null,"goal_label"?: string,"goal_proposed_start"?: number | null,"goal_proposed_target"?: number | null,"goal_start"?: number | null,"goal_target"?: number | null,"goal_unit"?: string,"id"?: string,"name"?: string,"notes"?: string,"phone"?: string | null,"status"?: Database["public"]['Enums']["client_status"],"tone"?: string,"trainer_id"?: string,"user_id"?: string | null,"weigh_frequency"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clients_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "trainers"
      referencedColumns: ["id"]
    }
                  ]
                },"documents": {
                  Row: {
                    "client_id": string,"created_at": string,"id": string,"kind": string,"name": string,"storage_path": string,"uploaded_by": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"id"?: string,"kind": string,"name": string,"storage_path": string,"uploaded_by": string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"name"?: string,"storage_path"?: string,"uploaded_by"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "created_at": string,"description": string,"equipment": string,"id": string,"muscle_group": string,"name": string,"trainer_id": string | null,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"equipment"?: string,"id"?: string,"muscle_group": string,"name": string,"trainer_id"?: string | null,"video_url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"equipment"?: string,"id"?: string,"muscle_group"?: string,"name"?: string,"trainer_id"?: string | null,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercises_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "trainers"
      referencedColumns: ["id"]
    }
                  ]
                },"habits": {
                  Row: {
                    "client_id": string,"day": string,"id": string,"steps": number | null,"water_ml": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"day": string,"id"?: string,"steps"?: number | null,"water_ml"?: number | null
                  }
                  Update: {
                    "client_id"?: string,"day"?: string,"id"?: string,"steps"?: number | null,"water_ml"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "habits_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"measurements": {
                  Row: {
                    "arm_cm": number | null,"chest_cm": number | null,"client_id": string,"confirmed": boolean,"created_at": string,"hips_cm": number | null,"id": string,"taken_on": string,"thigh_cm": number | null,"waist_cm": number | null,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "arm_cm"?: number | null,"chest_cm"?: number | null,"client_id": string,"confirmed"?: boolean,"created_at"?: string,"hips_cm"?: number | null,"id"?: string,"taken_on": string,"thigh_cm"?: number | null,"waist_cm"?: number | null,"weight_kg"?: number | null
                  }
                  Update: {
                    "arm_cm"?: number | null,"chest_cm"?: number | null,"client_id"?: string,"confirmed"?: boolean,"created_at"?: string,"hips_cm"?: number | null,"id"?: string,"taken_on"?: string,"thigh_cm"?: number | null,"waist_cm"?: number | null,"weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "measurements_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"client_id": string,"created_at": string,"document_id": string | null,"id": string,"read_at": string | null,"sender": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"client_id": string,"created_at"?: string,"document_id"?: string | null,"id"?: string,"read_at"?: string | null,"sender": string
                  }
                  Update: {
                    "body"?: string,"client_id"?: string,"created_at"?: string,"document_id"?: string | null,"id"?: string,"read_at"?: string | null,"sender"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    }
                  ]
                },"packages": {
                  Row: {
                    "client_id": string,"created_at": string,"ends_on": string | null,"id": string,"kind": Database["public"]['Enums']["package_kind"],"label": string,"lessons_total": number | null,"price_cents": number,"starts_on": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"ends_on"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["package_kind"],"label"?: string,"lessons_total"?: number | null,"price_cents": number,"starts_on": string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"ends_on"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["package_kind"],"label"?: string,"lessons_total"?: number | null,"price_cents"?: number,"starts_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "packages_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_cents": number,"client_id": string | null,"created_at": string,"description": string,"due_on": string,"id": string,"package_id": string | null,"paid_on": string | null,"trainer_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"client_id"?: string | null,"created_at"?: string,"description": string,"due_on": string,"id"?: string,"package_id"?: string | null,"paid_on"?: string | null,"trainer_id": string
                  }
                  Update: {
                    "amount_cents"?: number,"client_id"?: string | null,"created_at"?: string,"description"?: string,"due_on"?: string,"id"?: string,"package_id"?: string | null,"paid_on"?: string | null,"trainer_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_client_id_trainer_id_fkey"
      columns: ["client_id","trainer_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id","trainer_id"]
    },{
      foreignKeyName: "payments_package_id_client_id_fkey"
      columns: ["package_id","client_id"]
isOneToOne: false
      referencedRelation: "packages"
      referencedColumns: ["id","client_id"]
    },{
      foreignKeyName: "payments_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "trainers"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_days": {
                  Row: {
                    "focus": string,"id": string,"label": string,"plan_id": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "focus"?: string,"id"?: string,"label": string,"plan_id": string,"position": number
                  }
                  Update: {
                    "focus"?: string,"id"?: string,"label"?: string,"plan_id"?: string,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_days_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "workout_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_exercises": {
                  Row: {
                    "day_id": string,"exercise_id": string | null,"id": string,"load": string,"name": string | null,"notes": string,"position": number,"rest": string,"sets": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day_id": string,"exercise_id"?: string | null,"id"?: string,"load"?: string,"name"?: string | null,"notes"?: string,"position": number,"rest"?: string,"sets"?: string
                  }
                  Update: {
                    "day_id"?: string,"exercise_id"?: string | null,"id"?: string,"load"?: string,"name"?: string | null,"notes"?: string,"position"?: number,"rest"?: string,"sets"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_exercises_day_id_fkey"
      columns: ["day_id"]
isOneToOne: false
      referencedRelation: "plan_days"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"id": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"sessions": {
                  Row: {
                    "client_id": string,"created_at": string,"duration_min": number,"id": string,"kind": string,"online": boolean,"package_id": string | null,"place": string,"starts_at": string,"status": Database["public"]['Enums']["session_status"],"trainer_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"duration_min": number,"id"?: string,"kind"?: string,"online"?: boolean,"package_id"?: string | null,"place"?: string,"starts_at": string,"status"?: Database["public"]['Enums']["session_status"],"trainer_id": string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"duration_min"?: number,"id"?: string,"kind"?: string,"online"?: boolean,"package_id"?: string | null,"place"?: string,"starts_at"?: string,"status"?: Database["public"]['Enums']["session_status"],"trainer_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sessions_client_id_trainer_id_fkey"
      columns: ["client_id","trainer_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id","trainer_id"]
    },{
      foreignKeyName: "sessions_package_id_client_id_fkey"
      columns: ["package_id","client_id"]
isOneToOne: false
      referencedRelation: "packages"
      referencedColumns: ["id","client_id"]
    }
                  ]
                },"trainers": {
                  Row: {
                    "color": string,"created_at": string,"id": string,"license_expires_at": string,"logo_path": string | null,"name": string,"notifications": NonNullable<Json>,"slug": string,"sounds_enabled": boolean,"status": Database["public"]['Enums']["trainer_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"id"?: string,"license_expires_at": string,"logo_path"?: string | null,"name": string,"notifications"?: NonNullable<Json>,"slug": string,"sounds_enabled"?: boolean,"status"?: Database["public"]['Enums']["trainer_status"],"user_id": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"id"?: string,"license_expires_at"?: string,"logo_path"?: string | null,"name"?: string,"notifications"?: NonNullable<Json>,"slug"?: string,"sounds_enabled"?: boolean,"status"?: Database["public"]['Enums']["trainer_status"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"workout_logs": {
                  Row: {
                    "client_id": string,"created_at": string,"done_on": string,"id": string,"plan_day_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"done_on": string,"id"?: string,"plan_day_id"?: string | null
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"done_on"?: string,"id"?: string,"plan_day_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_logs_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_logs_plan_day_id_fkey"
      columns: ["plan_day_id"]
isOneToOne: false
      referencedRelation: "plan_days"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_plans": {
                  Row: {
                    "active": boolean,"client_id": string,"created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"client_id": string,"created_at"?: string,"id"?: string,"name"?: string
                  }
                  Update: {
                    "active"?: boolean,"client_id"?: string,"created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_plans_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "complete_registration":
{ Args: { "p_consent": boolean,"p_gender"?: string,"p_goal_start"?: number,"p_goal_target"?: number,"p_phone"?: string,"p_weigh_frequency"?: string }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_my_client":
{ Args: { "p_client_id": string }; Returns: boolean
                           },
"my_access":
{ Args: Record<PropertyKey, never>; Returns: {
              "client_trainer_slug": string,"role": Database["public"]['Enums']["user_role"],"trainer_active": boolean
            }[]
                           },
"my_client":
{ Args: Record<PropertyKey, never>; Returns: {
              "consent_at": string,"email": string,"gender": string,"goal_current": number,"goal_label": string,"goal_proposed_start": number,"goal_proposed_target": number,"goal_start": number,"goal_target": number,"goal_unit": string,"id": string,"name": string,"phone": string,"tone": string,"trainer_id": string,"weigh_frequency": string
            }[]
                           },
"my_client_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"my_client_trainer_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"my_trainer_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"trainer_branding":
{ Args: { "p_slug": string }; Returns: {
              "active": boolean,"color": string,"logo_path": string,"name": string
            }[]
                           }
          }
          Enums: {
            "ai_role": "user"|"assistant","alert_kind": "pain"|"change_request"|"package_expiring","client_status": "active"|"archived","package_kind": "lessons"|"time","request_status": "open"|"handled","session_status": "scheduled"|"done"|"cancelled","trainer_status": "active"|"suspended","user_role": "admin"|"trainer"|"client"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "ai_role": ["user", "assistant"],"alert_kind": ["pain", "change_request", "package_expiring"],"client_status": ["active", "archived"],"package_kind": ["lessons", "time"],"request_status": ["open", "handled"],"session_status": ["scheduled", "done", "cancelled"],"trainer_status": ["active", "suspended"],"user_role": ["admin", "trainer", "client"]
          }
        }
} as const
