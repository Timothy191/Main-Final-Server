export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          access_granted: boolean | null
          access_type: string
          alcohol_tested: string
          badge_id: string | null
          denial_reason: string | null
          department_id: string | null
          device_id: string | null
          direction: string
          gate_location: string
          id: string
          operator: string | null
          scanned_at: string | null
        }
        Insert: {
          access_granted?: boolean | null
          access_type: string
          alcohol_tested?: string
          badge_id?: string | null
          denial_reason?: string | null
          department_id?: string | null
          device_id?: string | null
          direction: string
          gate_location: string
          id?: string
          operator?: string | null
          scanned_at?: string | null
        }
        Update: {
          access_granted?: boolean | null
          access_type?: string
          alcohol_tested?: string
          badge_id?: string | null
          denial_reason?: string | null
          department_id?: string | null
          device_id?: string | null
          direction?: string
          gate_location?: string
          id?: string
          operator?: string | null
          scanned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'access_logs_badge_id_fkey'
            columns: ['badge_id']
            isOneToOne: false
            referencedRelation: 'badges'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'access_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'access_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'access_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      access_logs_archive: {
        Row: {
          access_granted: boolean | null
          access_type: string
          alcohol_tested: string
          archived_week_start: string
          badge_id: string | null
          denial_reason: string | null
          department_id: string | null
          direction: string
          gate_location: string
          id: string
          scanned_at: string | null
        }
        Insert: {
          access_granted?: boolean | null
          access_type: string
          alcohol_tested?: string
          archived_week_start?: string
          badge_id?: string | null
          denial_reason?: string | null
          department_id?: string | null
          direction: string
          gate_location: string
          id?: string
          scanned_at?: string | null
        }
        Update: {
          access_granted?: boolean | null
          access_type?: string
          alcohol_tested?: string
          archived_week_start?: string
          badge_id?: string | null
          denial_reason?: string | null
          department_id?: string | null
          direction?: string
          gate_location?: string
          id?: string
          scanned_at?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          completion_tokens: number
          created_at: string
          estimated_cost_usd: number
          id: string
          metadata: Json
          model: string
          prompt_tokens: number
          provider: string
          session_id: string
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          estimated_cost_usd?: number
          id?: string
          metadata?: Json
          model: string
          prompt_tokens?: number
          provider: string
          session_id: string
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          estimated_cost_usd?: number
          id?: string
          metadata?: Json
          model?: string
          prompt_tokens?: number
          provider?: string
          session_id?: string
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          department_id: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          performed_by: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          department_id?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          department_id?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'audit_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'audit_logs_performed_by_fkey'
            columns: ['performed_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      badges: {
        Row: {
          department_id: string | null
          entity_type: string
          equipment_id: string | null
          expires_at: string | null
          fleet_id: string | null
          id: string
          is_active: boolean | null
          issued_at: string | null
          personnel_id: string | null
          qr_code: string
          revoked_at: string | null
          visitor_id: string | null
        }
        Insert: {
          department_id?: string | null
          entity_type: string
          equipment_id?: string | null
          expires_at?: string | null
          fleet_id?: string | null
          id?: string
          is_active?: boolean | null
          issued_at?: string | null
          personnel_id?: string | null
          qr_code: string
          revoked_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          department_id?: string | null
          entity_type?: string
          equipment_id?: string | null
          expires_at?: string | null
          fleet_id?: string | null
          id?: string
          is_active?: boolean | null
          issued_at?: string | null
          personnel_id?: string | null
          qr_code?: string
          revoked_at?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'badges_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'badges_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'badges_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'badges_equipment_id_fkey'
            columns: ['equipment_id']
            isOneToOne: false
            referencedRelation: 'equipment'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'badges_fleet_id_fkey'
            columns: ['fleet_id']
            isOneToOne: false
            referencedRelation: 'fleet'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'badges_personnel_id_fkey'
            columns: ['personnel_id']
            isOneToOne: false
            referencedRelation: 'personnel'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'badges_visitor_id_fkey'
            columns: ['visitor_id']
            isOneToOne: false
            referencedRelation: 'visitors'
            referencedColumns: ['id']
          },
        ]
      }
      breakdowns: {
        Row: {
          completed_by: string | null
          created_at: string
          created_by: string | null
          date_in: string
          date_out: string | null
          deleted_at: string | null
          department_id: string
          duration_hours: number | null
          fleet_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          machine_name: string | null
          machine_type: string
          missing_book_in: boolean
          reason: string
          repair_notes: string | null
          status: string
          sync_status: string | null
          time_in: string | null
          time_out: string | null
          updated_at: string
        }
        Insert: {
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          date_in: string
          date_out?: string | null
          deleted_at?: string | null
          department_id: string
          duration_hours?: number | null
          fleet_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          machine_name?: string | null
          machine_type: string
          missing_book_in?: boolean
          reason: string
          repair_notes?: string | null
          status?: string
          sync_status?: string | null
          time_in?: string | null
          time_out?: string | null
          updated_at?: string
        }
        Update: {
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          date_in?: string
          date_out?: string | null
          deleted_at?: string | null
          department_id?: string
          duration_hours?: number | null
          fleet_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          machine_name?: string | null
          machine_type?: string
          missing_book_in?: boolean
          reason?: string
          repair_notes?: string | null
          status?: string
          sync_status?: string | null
          time_in?: string | null
          time_out?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'breakdowns_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'breakdowns_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'breakdowns_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      daily_logs: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'daily_logs_created_by_fkey1'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_logs_department_id_fkey1'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_logs_department_id_fkey1'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'daily_logs_department_id_fkey1'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'daily_logs_updated_by_fkey1'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      daily_logs_2025_01: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_02: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_03: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_04: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_05: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_06: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_07: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_08: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_09: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_10: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_11: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2025_12: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_01: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_02: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_03: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_04: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_05: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_06: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_07: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_08: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_09: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_10: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_11: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2026_12: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_01: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_02: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_03: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_04: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_05: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_06: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_07: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_08: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_09: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_10: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_11: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_2027_12: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: string
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: string
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_logs_legacy: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          idempotency_key: string | null
          last_synced_at: string | null
          log_date: string
          notes: string | null
          shift: Database['public']['Enums']['shift_type']
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date: string
          notes?: string | null
          shift?: Database['public']['Enums']['shift_type']
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          idempotency_key?: string | null
          last_synced_at?: string | null
          log_date?: string
          notes?: string | null
          shift?: Database['public']['Enums']['shift_type']
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'daily_logs_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'daily_logs_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'daily_logs_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      delay_categories: {
        Row: {
          color: string
          deleted_at: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          color?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          color?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          color: string
          created_at: string
          deleted_at: string | null
          description: string | null
          display_name: string
          icon: string
          id: string
          name: string
          personality: string | null
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_name: string
          icon: string
          id?: string
          name: string
          personality?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string
          id?: string
          name?: string
          personality?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          summary: string | null
          title: string
          version_number: number
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          summary?: string | null
          title: string
          version_number: number
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          summary?: string | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: 'document_versions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'document_versions_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
        ]
      }
      documents: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department_id: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documents_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'documents_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      dozer_rolls: {
        Row: {
          area_covered_sqm: number | null
          blade_passes: number
          created_at: string
          department_id: string
          hours_operated: number | null
          id: string
          machine_id: string
          material_moved_tonnes: number | null
          notes: string | null
          operator_id: string | null
          push_count: number
          roll_date: string
          shift_type: string
          updated_at: string
        }
        Insert: {
          area_covered_sqm?: number | null
          blade_passes?: number
          created_at?: string
          department_id: string
          hours_operated?: number | null
          id?: string
          machine_id: string
          material_moved_tonnes?: number | null
          notes?: string | null
          operator_id?: string | null
          push_count?: number
          roll_date: string
          shift_type: string
          updated_at?: string
        }
        Update: {
          area_covered_sqm?: number | null
          blade_passes?: number
          created_at?: string
          department_id?: string
          hours_operated?: number | null
          id?: string
          machine_id?: string
          material_moved_tonnes?: number | null
          notes?: string | null
          operator_id?: string | null
          push_count?: number
          roll_date?: string
          shift_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dozer_rolls_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dozer_rolls_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'dozer_rolls_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'dozer_rolls_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'dozer_rolls_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dozer_rolls_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'operators'
            referencedColumns: ['id']
          },
        ]
      }
      dozer_rolls_archive: {
        Row: {
          area_covered_sqm: number | null
          blade_passes: number
          created_at: string
          department_id: string
          hours_operated: number | null
          id: string
          machine_id: string
          material_moved_tonnes: number | null
          notes: string | null
          operator_id: string | null
          push_count: number
          roll_date: string
          shift_type: string
          updated_at: string
        }
        Insert: {
          area_covered_sqm?: number | null
          blade_passes?: number
          created_at?: string
          department_id: string
          hours_operated?: number | null
          id?: string
          machine_id: string
          material_moved_tonnes?: number | null
          notes?: string | null
          operator_id?: string | null
          push_count?: number
          roll_date: string
          shift_type: string
          updated_at?: string
        }
        Update: {
          area_covered_sqm?: number | null
          blade_passes?: number
          created_at?: string
          department_id?: string
          hours_operated?: number | null
          id?: string
          machine_id?: string
          material_moved_tonnes?: number | null
          notes?: string | null
          operator_id?: string | null
          push_count?: number
          roll_date?: string
          shift_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      drill_operations: {
        Row: {
          block_drilled: string | null
          close_hours: number | null
          comments: string | null
          created_at: string
          created_by: string | null
          delay_blasting: number | null
          delay_elec_breakdown: number | null
          delay_get: number | null
          delay_lunch_breaks: number | null
          delay_maintenance: number | null
          delay_mech_breakdown: number | null
          delay_natural: number | null
          delay_no_operator: number | null
          delay_non_prod_other: number | null
          delay_safety_talks: number | null
          delay_tramming: number | null
          department_id: string
          engineering_delays_minutes: number | null
          external_delays_minutes: number | null
          holes: number | null
          id: string
          machine_id: string
          meters_drilled: number | null
          notes: string | null
          open_hours: number | null
          operation_date: string
          operator_id: string | null
          operator_name: string | null
          production_delays_minutes: number | null
          shift_id: string | null
          shift_type: string | null
          site: string | null
          standard_delays_hours: number | null
          status: string | null
          total_hours: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block_drilled?: string | null
          close_hours?: number | null
          comments?: string | null
          created_at?: string
          created_by?: string | null
          delay_blasting?: number | null
          delay_elec_breakdown?: number | null
          delay_get?: number | null
          delay_lunch_breaks?: number | null
          delay_maintenance?: number | null
          delay_mech_breakdown?: number | null
          delay_natural?: number | null
          delay_no_operator?: number | null
          delay_non_prod_other?: number | null
          delay_safety_talks?: number | null
          delay_tramming?: number | null
          department_id: string
          engineering_delays_minutes?: number | null
          external_delays_minutes?: number | null
          holes?: number | null
          id?: string
          machine_id: string
          meters_drilled?: number | null
          notes?: string | null
          open_hours?: number | null
          operation_date?: string
          operator_id?: string | null
          operator_name?: string | null
          production_delays_minutes?: number | null
          shift_id?: string | null
          shift_type?: string | null
          site?: string | null
          standard_delays_hours?: number | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block_drilled?: string | null
          close_hours?: number | null
          comments?: string | null
          created_at?: string
          created_by?: string | null
          delay_blasting?: number | null
          delay_elec_breakdown?: number | null
          delay_get?: number | null
          delay_lunch_breaks?: number | null
          delay_maintenance?: number | null
          delay_mech_breakdown?: number | null
          delay_natural?: number | null
          delay_no_operator?: number | null
          delay_non_prod_other?: number | null
          delay_safety_talks?: number | null
          delay_tramming?: number | null
          department_id?: string
          engineering_delays_minutes?: number | null
          external_delays_minutes?: number | null
          holes?: number | null
          id?: string
          machine_id?: string
          meters_drilled?: number | null
          notes?: string | null
          open_hours?: number | null
          operation_date?: string
          operator_id?: string | null
          operator_name?: string | null
          production_delays_minutes?: number | null
          shift_id?: string | null
          shift_type?: string | null
          site?: string | null
          standard_delays_hours?: number | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'drill_operations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'drill_operations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'drill_operations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'drill_operations_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'drill_operations_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'drill_operations_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'drill_operations_shift_id_fkey'
            columns: ['shift_id']
            isOneToOne: false
            referencedRelation: 'shift_status'
            referencedColumns: ['id']
          },
        ]
      }
      drill_operations_archive: {
        Row: {
          block_drilled: string | null
          close_hours: number | null
          created_at: string
          created_by: string | null
          delay_blasting: number | null
          delay_elec_breakdown: number | null
          delay_get: number | null
          delay_lunch_breaks: number | null
          delay_maintenance: number | null
          delay_mech_breakdown: number | null
          delay_natural: number | null
          delay_no_operator: number | null
          delay_non_prod_other: number | null
          delay_safety_talks: number | null
          delay_tramming: number | null
          department_id: string
          holes: number | null
          id: string
          machine_id: string
          meters_drilled: number | null
          notes: string | null
          open_hours: number | null
          operation_date: string
          operator_id: string | null
          operator_name: string | null
          shift_id: string | null
          shift_type: string | null
          status: string | null
          total_hours: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block_drilled?: string | null
          close_hours?: number | null
          created_at?: string
          created_by?: string | null
          delay_blasting?: number | null
          delay_elec_breakdown?: number | null
          delay_get?: number | null
          delay_lunch_breaks?: number | null
          delay_maintenance?: number | null
          delay_mech_breakdown?: number | null
          delay_natural?: number | null
          delay_no_operator?: number | null
          delay_non_prod_other?: number | null
          delay_safety_talks?: number | null
          delay_tramming?: number | null
          department_id: string
          holes?: number | null
          id?: string
          machine_id: string
          meters_drilled?: number | null
          notes?: string | null
          open_hours?: number | null
          operation_date?: string
          operator_id?: string | null
          operator_name?: string | null
          shift_id?: string | null
          shift_type?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block_drilled?: string | null
          close_hours?: number | null
          created_at?: string
          created_by?: string | null
          delay_blasting?: number | null
          delay_elec_breakdown?: number | null
          delay_get?: number | null
          delay_lunch_breaks?: number | null
          delay_maintenance?: number | null
          delay_mech_breakdown?: number | null
          delay_natural?: number | null
          delay_no_operator?: number | null
          delay_non_prod_other?: number | null
          delay_safety_talks?: number | null
          delay_tramming?: number | null
          department_id?: string
          holes?: number | null
          id?: string
          machine_id?: string
          meters_drilled?: number | null
          notes?: string | null
          open_hours?: number | null
          operation_date?: string
          operator_id?: string | null
          operator_name?: string | null
          shift_id?: string | null
          shift_type?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      embedding_cache: {
        Row: {
          created_at: string
          embedding: string
          text_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding: string
          text_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          embedding?: string
          text_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          accessible_departments: string[] | null
          auth_id: string
          created_at: string
          deleted_at: string | null
          department_id: string | null
          employee_code: string | null
          full_name: string
          id: string
          pin_hash: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          accessible_departments?: string[] | null
          auth_id: string
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          employee_code?: string | null
          full_name: string
          id?: string
          pin_hash?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          accessible_departments?: string[] | null
          auth_id?: string
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          employee_code?: string | null
          full_name?: string
          id?: string
          pin_hash?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employees_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employees_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'employees_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      engineering_notes: {
        Row: {
          action_taken: string
          created_at: string
          created_by: string | null
          department_id: string
          description: string
          id: string
          issue_type: string
          machine_id: string | null
          note_date: string
          requires_follow_up: boolean
          resolved_at: string | null
          severity: string
          shift_type: string
          status: string
          updated_at: string
        }
        Insert: {
          action_taken: string
          created_at?: string
          created_by?: string | null
          department_id: string
          description: string
          id?: string
          issue_type: string
          machine_id?: string | null
          note_date: string
          requires_follow_up?: boolean
          resolved_at?: string | null
          severity: string
          shift_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_taken?: string
          created_at?: string
          created_by?: string | null
          department_id?: string
          description?: string
          id?: string
          issue_type?: string
          machine_id?: string | null
          note_date?: string
          requires_follow_up?: boolean
          resolved_at?: string | null
          severity?: string
          shift_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'engineering_notes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'engineering_notes_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'engineering_notes_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'engineering_notes_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'engineering_notes_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'engineering_notes_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
        ]
      }
      engineering_notes_archive: {
        Row: {
          action_taken: string
          created_at: string
          created_by: string | null
          department_id: string
          description: string
          id: string
          issue_type: string
          machine_id: string | null
          note_date: string
          requires_follow_up: boolean
          resolved_at: string | null
          severity: string
          shift_type: string
          status: string
          updated_at: string
        }
        Insert: {
          action_taken: string
          created_at?: string
          created_by?: string | null
          department_id: string
          description: string
          id?: string
          issue_type: string
          machine_id?: string | null
          note_date: string
          requires_follow_up?: boolean
          resolved_at?: string | null
          severity: string
          shift_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_taken?: string
          created_at?: string
          created_by?: string | null
          department_id?: string
          description?: string
          id?: string
          issue_type?: string
          machine_id?: string | null
          note_date?: string
          requires_follow_up?: boolean
          resolved_at?: string | null
          severity?: string
          shift_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          assigned_to: string | null
          calibration_expiry: string | null
          created_at: string | null
          department_id: string | null
          equip_code: string
          equipment_type: string
          id: string
          manufacturer: string | null
          model: string | null
          serial_number: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          calibration_expiry?: string | null
          created_at?: string | null
          department_id?: string | null
          equip_code: string
          equipment_type: string
          id?: string
          manufacturer?: string | null
          model?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          calibration_expiry?: string | null
          created_at?: string | null
          department_id?: string | null
          equip_code?: string
          equipment_type?: string
          id?: string
          manufacturer?: string | null
          model?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'equipment_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'personnel'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'equipment_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'equipment_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'equipment_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      excavator_activity: {
        Row: {
          activity_date: string
          avg_cycle_time_seconds: number | null
          block_mined_id: string | null
          created_at: string
          department_id: string
          estimated_tonnes: number | null
          id: string
          loads: number
          machine_id: string
          material_type: string | null
          notes: string | null
          operator_id: string | null
          passes: number
          shift_type: string
          site_id: string | null
          updated_at: string
        }
        Insert: {
          activity_date: string
          avg_cycle_time_seconds?: number | null
          block_mined_id?: string | null
          created_at?: string
          department_id: string
          estimated_tonnes?: number | null
          id?: string
          loads?: number
          machine_id: string
          material_type?: string | null
          notes?: string | null
          operator_id?: string | null
          passes?: number
          shift_type: string
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          activity_date?: string
          avg_cycle_time_seconds?: number | null
          block_mined_id?: string | null
          created_at?: string
          department_id?: string
          estimated_tonnes?: number | null
          id?: string
          loads?: number
          machine_id?: string
          material_type?: string | null
          notes?: string | null
          operator_id?: string | null
          passes?: number
          shift_type?: string
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'excavator_activity_block_mined_id_fkey'
            columns: ['block_mined_id']
            isOneToOne: false
            referencedRelation: 'mine_blocks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'excavator_activity_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'excavator_activity_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'excavator_activity_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'excavator_activity_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'excavator_activity_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'excavator_activity_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'operators'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'excavator_activity_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
        ]
      }
      excavator_activity_archive: {
        Row: {
          activity_date: string
          avg_cycle_time_seconds: number | null
          block_mined_id: string | null
          created_at: string
          department_id: string
          estimated_tonnes: number | null
          id: string
          loads: number
          machine_id: string
          material_type: string | null
          notes: string | null
          operator_id: string | null
          passes: number
          shift_type: string
          site_id: string | null
          updated_at: string
        }
        Insert: {
          activity_date: string
          avg_cycle_time_seconds?: number | null
          block_mined_id?: string | null
          created_at?: string
          department_id: string
          estimated_tonnes?: number | null
          id?: string
          loads?: number
          machine_id: string
          material_type?: string | null
          notes?: string | null
          operator_id?: string | null
          passes?: number
          shift_type: string
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          activity_date?: string
          avg_cycle_time_seconds?: number | null
          block_mined_id?: string | null
          created_at?: string
          department_id?: string
          estimated_tonnes?: number | null
          id?: string
          loads?: number
          machine_id?: string
          material_type?: string | null
          notes?: string | null
          operator_id?: string | null
          passes?: number
          shift_type?: string
          site_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      excavator_dumper_assignments: {
        Row: {
          created_at: string
          dumper_machine_id: string
          excavator_activity_id: string
          id: string
          material_type: string
          notes: string | null
          total_bcm: number | null
          total_loads: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dumper_machine_id: string
          excavator_activity_id: string
          id?: string
          material_type?: string
          notes?: string | null
          total_bcm?: number | null
          total_loads?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dumper_machine_id?: string
          excavator_activity_id?: string
          id?: string
          material_type?: string
          notes?: string | null
          total_bcm?: number | null
          total_loads?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'excavator_dumper_assignments_dumper_machine_id_fkey'
            columns: ['dumper_machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'excavator_dumper_assignments_dumper_machine_id_fkey'
            columns: ['dumper_machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'excavator_dumper_assignments_excavator_activity_id_fkey'
            columns: ['excavator_activity_id']
            isOneToOne: false
            referencedRelation: 'excavator_activity'
            referencedColumns: ['id']
          },
        ]
      }
      excavator_dumper_assignments_archive: {
        Row: {
          created_at: string
          dumper_machine_id: string
          excavator_activity_id: string
          id: string
          material_type: string
          notes: string | null
          total_bcm: number | null
          total_loads: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dumper_machine_id: string
          excavator_activity_id: string
          id?: string
          material_type?: string
          notes?: string | null
          total_bcm?: number | null
          total_loads?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dumper_machine_id?: string
          excavator_activity_id?: string
          id?: string
          material_type?: string
          notes?: string | null
          total_bcm?: number | null
          total_loads?: number
          updated_at?: string
        }
        Relationships: []
      }
      fleet: {
        Row: {
          created_at: string | null
          department_id: string | null
          fleet_code: string
          id: string
          last_service_date: string | null
          make: string | null
          model: string | null
          next_service_date: string | null
          registration_number: string | null
          status: string
          updated_at: string | null
          vehicle_type: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          fleet_code: string
          id?: string
          last_service_date?: string | null
          make?: string | null
          model?: string | null
          next_service_date?: string | null
          registration_number?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          fleet_code?: string
          id?: string
          last_service_date?: string | null
          make?: string | null
          model?: string | null
          next_service_date?: string | null
          registration_number?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'fleet_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fleet_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'fleet_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      fuel_logs: {
        Row: {
          created_at: string
          created_by: string | null
          daily_log_id: string
          diesel_litres: number
          id: string
          machine_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          daily_log_id: string
          diesel_litres?: number
          id?: string
          machine_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          daily_log_id?: string
          diesel_litres?: number
          id?: string
          machine_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fuel_logs_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fuel_logs_daily_log_id_fkey'
            columns: ['daily_log_id']
            isOneToOne: false
            referencedRelation: 'daily_logs_legacy'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fuel_logs_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'fuel_logs_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fuel_logs_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      generated_reports: {
        Row: {
          department_id: string
          generated_at: string
          generated_by: string
          id: string
          pdf_url: string | null
          report_data: Json
          report_date: string
          shift_type: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          department_id: string
          generated_at?: string
          generated_by: string
          id?: string
          pdf_url?: string | null
          report_data: Json
          report_date: string
          shift_type?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          department_id?: string
          generated_at?: string
          generated_by?: string
          id?: string
          pdf_url?: string | null
          report_data?: Json
          report_date?: string
          shift_type?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'generated_reports_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'generated_reports_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'generated_reports_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'generated_reports_generated_by_fkey'
            columns: ['generated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'generated_reports_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'report_templates'
            referencedColumns: ['id']
          },
        ]
      }
      hourly_loads: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'hourly_loads_created_by_fkey1'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hourly_loads_department_id_fkey1'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hourly_loads_department_id_fkey1'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'hourly_loads_department_id_fkey1'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'hourly_loads_machine_id_fkey1'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'hourly_loads_machine_id_fkey1'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hourly_loads_updated_by_fkey1'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      hourly_loads_2025_01: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_02: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_03: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_04: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_05: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_06: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_07: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_08: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_09: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_10: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_11: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2025_12: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_01: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_02: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_03: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_04: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_05: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_06: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_07: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_08: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_09: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_10: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_11: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2026_12: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_01: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_02: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_03: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_04: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_05: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_06: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_07: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_08: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_09: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_10: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_11: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_2027_12: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          material_type: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          material_type?: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          material_type?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hourly_loads_legacy: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hour_01: number
          hour_02: number
          hour_03: number
          hour_04: number
          hour_05: number
          hour_06: number
          hour_07: number
          hour_08: number
          hour_09: number
          hour_10: number
          hour_11: number
          hour_12: number
          id: string
          load_date: string
          machine_id: string
          shift_type: string
          total_loads: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date: string
          machine_id: string
          shift_type: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hour_01?: number
          hour_02?: number
          hour_03?: number
          hour_04?: number
          hour_05?: number
          hour_06?: number
          hour_07?: number
          hour_08?: number
          hour_09?: number
          hour_10?: number
          hour_11?: number
          hour_12?: number
          id?: string
          load_date?: string
          machine_id?: string
          shift_type?: string
          total_loads?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'hourly_loads_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hourly_loads_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hourly_loads_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'hourly_loads_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'hourly_loads_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'hourly_loads_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hourly_loads_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      machine_configurations: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          hydraulic_pressure: number
          id: string
          power_allocation: number
          target_rpm: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          hydraulic_pressure: number
          id?: string
          power_allocation: number
          target_rpm: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          hydraulic_pressure?: number
          id?: string
          power_allocation?: number
          target_rpm?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'machine_configurations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_configurations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: true
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_configurations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: true
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machine_configurations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: true
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machine_configurations_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      machine_hours: {
        Row: {
          created_at: string
          created_by: string | null
          daily_log_id: string
          hours_worked: number
          id: string
          machine_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          daily_log_id: string
          hours_worked?: number
          id?: string
          machine_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          daily_log_id?: string
          hours_worked?: number
          id?: string
          machine_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'machine_hours_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_hours_daily_log_id_fkey'
            columns: ['daily_log_id']
            isOneToOne: false
            referencedRelation: 'daily_logs_legacy'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_hours_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'machine_hours_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_hours_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      machine_operations: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          end_time: string | null
          hours_worked: number | null
          id: string
          machine_id: string
          operator_id: string | null
          shift_date: string
          shift_type: string
          site_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          end_time?: string | null
          hours_worked?: number | null
          id?: string
          machine_id: string
          operator_id?: string | null
          shift_date: string
          shift_type: string
          site_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          end_time?: string | null
          hours_worked?: number | null
          id?: string
          machine_id?: string
          operator_id?: string | null
          shift_date?: string
          shift_type?: string
          site_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'machine_operations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_operations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_operations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machine_operations_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machine_operations_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'machine_operations_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_operations_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'operators'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_operations_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
        ]
      }
      machine_operations_archive: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          end_time: string | null
          hours_worked: number | null
          id: string
          machine_id: string
          operator_id: string | null
          shift_date: string
          shift_type: string
          site_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          end_time?: string | null
          hours_worked?: number | null
          id?: string
          machine_id: string
          operator_id?: string | null
          shift_date: string
          shift_type: string
          site_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          end_time?: string | null
          hours_worked?: number | null
          id?: string
          machine_id?: string
          operator_id?: string | null
          shift_date?: string
          shift_type?: string
          site_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      machine_telemetry: {
        Row: {
          alert_codes: string[] | null
          alert_count: number | null
          ambient_temp: number | null
          bit_depth: number | null
          created_at: string
          department_id: string
          engine_rpm: number | null
          engine_temp: number | null
          fuel_level: number | null
          hole_depth: number | null
          hydraulic_pressure: number | null
          hydraulic_temp: number | null
          id: string
          machine_id: string
          mud_flow_rate: number | null
          operating_hours: number | null
          penetration_rate: number | null
          recorded_at: string
          rotation_torque: number | null
          standpipe_pressure: number | null
          vibration_level: number | null
          weight_on_bit: number | null
          year_month: string
        }
        Insert: {
          alert_codes?: string[] | null
          alert_count?: number | null
          ambient_temp?: number | null
          bit_depth?: number | null
          created_at?: string
          department_id: string
          engine_rpm?: number | null
          engine_temp?: number | null
          fuel_level?: number | null
          hole_depth?: number | null
          hydraulic_pressure?: number | null
          hydraulic_temp?: number | null
          id?: string
          machine_id: string
          mud_flow_rate?: number | null
          operating_hours?: number | null
          penetration_rate?: number | null
          recorded_at?: string
          rotation_torque?: number | null
          standpipe_pressure?: number | null
          vibration_level?: number | null
          weight_on_bit?: number | null
          year_month?: string
        }
        Update: {
          alert_codes?: string[] | null
          alert_count?: number | null
          ambient_temp?: number | null
          bit_depth?: number | null
          created_at?: string
          department_id?: string
          engine_rpm?: number | null
          engine_temp?: number | null
          fuel_level?: number | null
          hole_depth?: number | null
          hydraulic_pressure?: number | null
          hydraulic_temp?: number | null
          id?: string
          machine_id?: string
          mud_flow_rate?: number | null
          operating_hours?: number | null
          penetration_rate?: number | null
          recorded_at?: string
          rotation_torque?: number | null
          standpipe_pressure?: number | null
          vibration_level?: number | null
          weight_on_bit?: number | null
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: 'machine_telemetry_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machine_telemetry_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machine_telemetry_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machine_telemetry_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'machine_telemetry_machine_id_fkey'
            columns: ['machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
        ]
      }
      machine_telemetry_archive: {
        Row: {
          alert_codes: string[] | null
          alert_count: number | null
          ambient_temp: number | null
          archived_at: string
          bit_depth: number | null
          created_at: string
          department_id: string
          engine_rpm: number | null
          engine_temp: number | null
          fuel_level: number | null
          hole_depth: number | null
          hydraulic_pressure: number | null
          hydraulic_temp: number | null
          id: string
          machine_id: string
          mud_flow_rate: number | null
          operating_hours: number | null
          penetration_rate: number | null
          record_count: number
          recorded_at: string
          rotation_torque: number | null
          standpipe_pressure: number | null
          vibration_level: number | null
          weight_on_bit: number | null
          year_month: string
        }
        Insert: {
          alert_codes?: string[] | null
          alert_count?: number | null
          ambient_temp?: number | null
          archived_at?: string
          bit_depth?: number | null
          created_at: string
          department_id: string
          engine_rpm?: number | null
          engine_temp?: number | null
          fuel_level?: number | null
          hole_depth?: number | null
          hydraulic_pressure?: number | null
          hydraulic_temp?: number | null
          id: string
          machine_id: string
          mud_flow_rate?: number | null
          operating_hours?: number | null
          penetration_rate?: number | null
          record_count: number
          recorded_at: string
          rotation_torque?: number | null
          standpipe_pressure?: number | null
          vibration_level?: number | null
          weight_on_bit?: number | null
          year_month: string
        }
        Update: {
          alert_codes?: string[] | null
          alert_count?: number | null
          ambient_temp?: number | null
          archived_at?: string
          bit_depth?: number | null
          created_at?: string
          department_id?: string
          engine_rpm?: number | null
          engine_temp?: number | null
          fuel_level?: number | null
          hole_depth?: number | null
          hydraulic_pressure?: number | null
          hydraulic_temp?: number | null
          id?: string
          machine_id?: string
          mud_flow_rate?: number | null
          operating_hours?: number | null
          penetration_rate?: number | null
          record_count?: number
          recorded_at?: string
          rotation_torque?: number | null
          standpipe_pressure?: number | null
          vibration_level?: number | null
          weight_on_bit?: number | null
          year_month?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          active: boolean
          bin_factor: number | null
          created_at: string
          deleted_at: string | null
          department_id: string
          id: string
          machine_type: string
          name: string
          report_exempt: boolean
          serial_number: string | null
          site_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          bin_factor?: number | null
          created_at?: string
          deleted_at?: string | null
          department_id: string
          id?: string
          machine_type: string
          name: string
          report_exempt?: boolean
          serial_number?: string | null
          site_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          bin_factor?: number | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string
          id?: string
          machine_type?: string
          name?: string
          report_exempt?: boolean
          serial_number?: string | null
          site_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'machines_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machines_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machines_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machines_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
        ]
      }
      memory_embeddings: {
        Row: {
          content: string
          created_at: string
          embedding: string
          id: string
          memory_type: Database['public']['Enums']['memory_type']
          metadata: Json
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding: string
          id?: string
          memory_type?: Database['public']['Enums']['memory_type']
          metadata?: Json
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          memory_type?: Database['public']['Enums']['memory_type']
          metadata?: Json
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mine_blocks: {
        Row: {
          active: boolean
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          site_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          site_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          site_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'mine_blocks_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
        ]
      }
      operational_delays: {
        Row: {
          affected_machine_id: string | null
          created_at: string
          created_by: string | null
          delay_category_id: string | null
          delay_date: string
          delay_minutes: number
          delay_type: string
          department_id: string
          description: string
          id: string
          impact_description: string
          recovery_action: string | null
          shift_type: string
          status: string
          updated_at: string
        }
        Insert: {
          affected_machine_id?: string | null
          created_at?: string
          created_by?: string | null
          delay_category_id?: string | null
          delay_date: string
          delay_minutes: number
          delay_type: string
          department_id: string
          description: string
          id?: string
          impact_description: string
          recovery_action?: string | null
          shift_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          affected_machine_id?: string | null
          created_at?: string
          created_by?: string | null
          delay_category_id?: string | null
          delay_date?: string
          delay_minutes?: number
          delay_type?: string
          department_id?: string
          description?: string
          id?: string
          impact_description?: string
          recovery_action?: string | null
          shift_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'operational_delays_affected_machine_id_fkey'
            columns: ['affected_machine_id']
            isOneToOne: false
            referencedRelation: 'machine_utilization_weekly'
            referencedColumns: ['machine_id']
          },
          {
            foreignKeyName: 'operational_delays_affected_machine_id_fkey'
            columns: ['affected_machine_id']
            isOneToOne: false
            referencedRelation: 'machines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'operational_delays_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'operational_delays_delay_category_id_fkey'
            columns: ['delay_category_id']
            isOneToOne: false
            referencedRelation: 'delay_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'operational_delays_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'operational_delays_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'operational_delays_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      operational_delays_archive: {
        Row: {
          affected_machine_id: string | null
          created_at: string
          created_by: string | null
          delay_category_id: string | null
          delay_date: string
          delay_minutes: number
          delay_type: string
          department_id: string
          description: string
          id: string
          impact_description: string
          recovery_action: string | null
          shift_type: string
          status: string
          updated_at: string
        }
        Insert: {
          affected_machine_id?: string | null
          created_at?: string
          created_by?: string | null
          delay_category_id?: string | null
          delay_date: string
          delay_minutes: number
          delay_type: string
          department_id: string
          description: string
          id?: string
          impact_description: string
          recovery_action?: string | null
          shift_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          affected_machine_id?: string | null
          created_at?: string
          created_by?: string | null
          delay_category_id?: string | null
          delay_date?: string
          delay_minutes?: number
          delay_type?: string
          department_id?: string
          description?: string
          id?: string
          impact_description?: string
          recovery_action?: string | null
          shift_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      operators: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          employee_code: string
          full_name: string
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          employee_code: string
          full_name: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          employee_code?: string
          full_name?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      personnel: {
        Row: {
          area: string | null
          created_at: string | null
          department_id: string | null
          emp_code: string
          first_name: string
          id: string
          id_number: string
          induction_expiry: string | null
          job_title: string | null
          medical_expiry: string | null
          status: string | null
          surname: string
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          department_id?: string | null
          emp_code: string
          first_name: string
          id?: string
          id_number: string
          induction_expiry?: string | null
          job_title?: string | null
          medical_expiry?: string | null
          status?: string | null
          surname: string
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string | null
          department_id?: string | null
          emp_code?: string
          first_name?: string
          id?: string
          id_number?: string
          induction_expiry?: string | null
          job_title?: string | null
          medical_expiry?: string | null
          status?: string | null
          surname?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'personnel_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'personnel_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'personnel_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      production_logs: {
        Row: {
          coal_tonnes: number
          created_at: string
          created_by: string | null
          daily_log_id: string
          id: string
          updated_at: string | null
          updated_by: string | null
          waste_tonnes: number
        }
        Insert: {
          coal_tonnes?: number
          created_at?: string
          created_by?: string | null
          daily_log_id: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          waste_tonnes?: number
        }
        Update: {
          coal_tonnes?: number
          created_at?: string
          created_by?: string | null
          daily_log_id?: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          waste_tonnes?: number
        }
        Relationships: [
          {
            foreignKeyName: 'production_logs_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'production_logs_daily_log_id_fkey'
            columns: ['daily_log_id']
            isOneToOne: false
            referencedRelation: 'daily_logs_legacy'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'production_logs_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      report_templates: {
        Row: {
          auto_generate: boolean
          config: Json | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          report_type: string
          updated_at: string | null
        }
        Insert: {
          auto_generate?: boolean
          config?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          report_type: string
          updated_at?: string | null
        }
        Update: {
          auto_generate?: boolean
          config?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          report_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      safety_incident_categories: {
        Row: {
          color: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          color?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          color?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      safety_incidents: {
        Row: {
          category_id: string | null
          closed_at: string | null
          corrective_action: string
          created_at: string
          department_id: string
          description: string
          id: string
          idempotency_key: string | null
          incident_date: string
          incident_type: Database['public']['Enums']['incident_type']
          injured_parties: number
          last_synced_at: string | null
          location: string
          reported_by: string | null
          reviewed_by: string | null
          root_cause: string
          severity_id: string | null
          shift_type: string
          status: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          closed_at?: string | null
          corrective_action: string
          created_at?: string
          department_id: string
          description: string
          id?: string
          idempotency_key?: string | null
          incident_date: string
          incident_type: Database['public']['Enums']['incident_type']
          injured_parties?: number
          last_synced_at?: string | null
          location: string
          reported_by?: string | null
          reviewed_by?: string | null
          root_cause: string
          severity_id?: string | null
          shift_type: string
          status?: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          closed_at?: string | null
          corrective_action?: string
          created_at?: string
          department_id?: string
          description?: string
          id?: string
          idempotency_key?: string | null
          incident_date?: string
          incident_type?: Database['public']['Enums']['incident_type']
          injured_parties?: number
          last_synced_at?: string | null
          location?: string
          reported_by?: string | null
          reviewed_by?: string | null
          root_cause?: string
          severity_id?: string | null
          shift_type?: string
          status?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'safety_incidents_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'safety_incidents_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'safety_incidents_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'safety_incidents_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'safety_incidents_reported_by_fkey'
            columns: ['reported_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'safety_incidents_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'safety_incidents_severity_id_fkey'
            columns: ['severity_id']
            isOneToOne: false
            referencedRelation: 'safety_severities'
            referencedColumns: ['id']
          },
        ]
      }
      safety_severities: {
        Row: {
          color: string
          id: string
          level: string
          sort_order: number
          updated_at: string | null
          weight: number
        }
        Insert: {
          color?: string
          id?: string
          level: string
          sort_order?: number
          updated_at?: string | null
          weight?: number
        }
        Update: {
          color?: string
          id?: string
          level?: string
          sort_order?: number
          updated_at?: string | null
          weight?: number
        }
        Relationships: []
      }
      shift_status: {
        Row: {
          approved_by: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          department_id: string
          id: string
          notes: string | null
          shift_date: string
          shift_type: Database['public']['Enums']['shift_type']
          status: Database['public']['Enums']['shift_status_type']
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          department_id: string
          id?: string
          notes?: string | null
          shift_date: string
          shift_type: Database['public']['Enums']['shift_type']
          status?: Database['public']['Enums']['shift_status_type']
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          department_id?: string
          id?: string
          notes?: string | null
          shift_date?: string
          shift_type?: Database['public']['Enums']['shift_type']
          status?: Database['public']['Enums']['shift_status_type']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shift_status_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shift_status_closed_by_fkey'
            columns: ['closed_by']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shift_status_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shift_status_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'shift_status_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      sites: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          site_code: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          site_code: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          site_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_watermarks: {
        Row: {
          last_processed_id: string
          table_name: string
          updated_at: string
        }
        Insert: {
          last_processed_id: string
          table_name: string
          updated_at?: string
        }
        Update: {
          last_processed_id?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          company: string | null
          created_at: string | null
          department_id: string | null
          first_name: string
          host_id: string | null
          id: string
          id_number: string | null
          reason_for_entry: string
          status: string | null
          surname: string
          visiting: string | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          company?: string | null
          created_at?: string | null
          department_id?: string | null
          first_name: string
          host_id?: string | null
          id?: string
          id_number?: string | null
          reason_for_entry: string
          status?: string | null
          surname: string
          visiting?: string | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          company?: string | null
          created_at?: string | null
          department_id?: string | null
          first_name?: string
          host_id?: string | null
          id?: string
          id_number?: string | null
          reason_for_entry?: string
          status?: string | null
          surname?: string
          visiting?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'visitors_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'visitors_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'visitors_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'visitors_host_id_fkey'
            columns: ['host_id']
            isOneToOne: false
            referencedRelation: 'personnel'
            referencedColumns: ['id']
          },
        ]
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string
          delivered_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number
          success: boolean
          webhook_endpoint_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          success?: boolean
          webhook_endpoint_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          success?: boolean
          webhook_endpoint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'webhook_delivery_logs_webhook_endpoint_id_fkey'
            columns: ['webhook_endpoint_id']
            isOneToOne: false
            referencedRelation: 'webhook_endpoints'
            referencedColumns: ['id']
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          department_id: string | null
          description: string | null
          event_types: string[]
          id: string
          secret: string | null
          svix_endpoint_id: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          description?: string | null
          event_types?: string[]
          id?: string
          secret?: string | null
          svix_endpoint_id?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          description?: string | null
          event_types?: string[]
          id?: string
          secret?: string | null
          svix_endpoint_id?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'webhook_endpoints_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'webhook_endpoints_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'webhook_endpoints_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
    }
    Views: {
      dept_production_summary: {
        Row: {
          department_display_name: string | null
          department_id: string | null
          department_name: string | null
          last_refreshed_at: string | null
          log_count: number | null
          summary_month: string | null
          total_coal_tonnes: number | null
          total_tonnes: number | null
          total_waste_tonnes: number | null
        }
        Relationships: []
      }
      machine_utilization_weekly: {
        Row: {
          department_id: string | null
          department_name: string | null
          last_refreshed_at: string | null
          machine_id: string | null
          machine_name: string | null
          machine_type: string | null
          shifts_recorded: number | null
          total_hours_worked: number | null
          utilization_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'machines_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'machines_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'dept_production_summary'
            referencedColumns: ['department_id']
          },
          {
            foreignKeyName: 'machines_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'safety_incident_monthly'
            referencedColumns: ['department_id']
          },
        ]
      }
      safety_incident_monthly: {
        Row: {
          department_id: string | null
          department_name: string | null
          incident_count: number | null
          incident_month: string | null
          incident_type: Database['public']['Enums']['incident_type'] | null
          last_refreshed_at: string | null
          status: string | null
          total_injured_parties: number | null
        }
        Relationships: []
      }
      slow_queries_summary: {
        Row: {
          calls: number | null
          mean_ms: number | null
          query_preview: string | null
          rows: number | null
          stddev_ms: number | null
          total_ms: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_monthly_control_room_shifts: { Args: never; Returns: undefined }
      archive_monthly_drill_operations: { Args: never; Returns: undefined }
      archive_telemetry_month: {
        Args: { p_year_month?: string }
        Returns: {
          archived_count: number
          machines_archived: number
        }[]
      }
      archive_weekly_access_logs: { Args: never; Returns: undefined }
      create_next_month_partitions: { Args: never; Returns: undefined }
      get_access_control_metrics_jsonb: {
        Args: { p_department_id: string }
        Returns: Json
      }
      get_conversation_history: {
        Args: {
          message_limit?: number
          p_session_id: string
          p_user_id: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          metadata: Json
        }[]
      }
      get_dept_production_summary: {
        Args: never
        Returns: {
          department_display_name: string | null
          department_id: string | null
          department_name: string | null
          last_refreshed_at: string | null
          log_count: number | null
          summary_month: string | null
          total_coal_tonnes: number | null
          total_tonnes: number | null
          total_waste_tonnes: number | null
        }[]
        SetofOptions: {
          from: '*'
          to: 'dept_production_summary'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_drill_monthly_summary: {
        Args: { p_department_id: string; p_year_month: string }
        Returns: {
          availability_pct: number
          downtime_hours: number
          machine_id: string
          machine_name: string
          productive_hours: number
          scheduled_hours: number
          utilization_pct: number
        }[]
      }
      get_machine_utilization_weekly: {
        Args: never
        Returns: {
          department_id: string | null
          department_name: string | null
          last_refreshed_at: string | null
          machine_id: string | null
          machine_name: string | null
          machine_type: string | null
          shifts_recorded: number | null
          total_hours_worked: number | null
          utilization_pct: number | null
        }[]
        SetofOptions: {
          from: '*'
          to: 'machine_utilization_weekly'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_monolithized_department_dashboard_payload: {
        Args: { dept_id: string }
        Returns: Json
      }
      get_safety_incident_monthly: {
        Args: never
        Returns: {
          department_id: string | null
          department_name: string | null
          incident_count: number | null
          incident_month: string | null
          incident_type: Database['public']['Enums']['incident_type'] | null
          last_refreshed_at: string | null
          status: string | null
          total_injured_parties: number | null
        }[]
        SetofOptions: {
          from: '*'
          to: 'safety_incident_monthly'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_telemetry_summary: {
        Args: {
          p_department_id: string
          p_granularity?: string
          p_machine_id?: string
        }
        Returns: {
          avg_engine_rpm: number
          avg_engine_temp: number
          avg_hydraulic_pressure: number
          avg_penetration_rate: number
          machine_id: string
          machine_name: string
          max_bit_depth: number
          max_hole_depth: number
          period: string
          record_count: number
          total_alerts: number
        }[]
      }
      get_user_daily_spend: {
        Args: { p_date?: string; p_user_id: string }
        Returns: number
      }
      has_department_access: { Args: { dept_id: string }; Returns: boolean }
      is_active: { Args: { record_deleted_at: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      search_memories_hybrid: {
        Args: {
          keyword_weight?: number
          match_count?: number
          p_memory_type?: string
          p_session_id?: string
          p_user_id: string
          query_embedding: string
          query_text: string
          semantic_weight?: number
          temporal_weight?: number
        }
        Returns: {
          combined_score: number
          content: string
          created_at: string
          id: string
          keyword_score: number
          memory_type: string
          metadata: Json
          semantic_score: number
          session_id: string
          temporal_score: number
        }[]
      }
      search_memories_semantic: {
        Args: {
          match_count?: number
          p_memory_type?: string
          p_session_id?: string
          p_user_id: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          created_at: string
          id: string
          memory_type: string
          metadata: Json
          session_id: string
          similarity: number
        }[]
      }
      user_department_id: { Args: never; Returns: string }
      exec_sql: {
        Args: { sql: string }
        Returns: Json
      }
      run_db_audit: { Args: never; Returns: Json }
      repair_table: {
        Args: { p_table_name: string; p_issue_category: string }
        Returns: Json
      }
    }
    Enums: {
      incident_type: 'near-miss' | 'incident' | 'lost-time' | 'equipment-damage'
      memory_type: 'episodic' | 'semantic'
      role_type:
        'admin' | 'supervisor' | 'operator' | 'maintenance' | 'viewer' | 'trainer' | 'relief'
      shift_status_type: 'open' | 'closed'
      shift_type: 'day' | 'night'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      incident_type: ['near-miss', 'incident', 'lost-time', 'equipment-damage'],
      memory_type: ['episodic', 'semantic'],
      role_type: ['admin', 'supervisor', 'operator', 'maintenance', 'viewer', 'trainer', 'relief'],
      shift_status_type: ['open', 'closed'],
      shift_type: ['day', 'night'],
    },
  },
} as const
