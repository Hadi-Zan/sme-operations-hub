export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WorkspaceRole = "member" | "owner";
export type WorkspaceMemberStatus = "active" | "deactivated";
export type WorkspaceInvitationStatus = "accepted" | "cancelled" | "pending";
export type WorkspaceInvitationActivationMode = "existing_account" | "set_password";
export type TaskPriority = "high" | "low" | "medium" | "urgent";
export type TaskStatus = "completed" | "in_progress" | "todo";
export type InventoryMovementType = "adjustment" | "stock_in" | "stock_out";
export type FollowUpStatus = "completed" | "pending";
export type AlertType =
  | "follow_up_due_today"
  | "follow_up_overdue"
  | "inventory_low_stock"
  | "task_overdue"
  | "task_urgent_today";
export type AlertSeverity = "critical" | "high" | "medium";
export type AttentionSourceType = "follow_up" | "inventory" | "task";

export type Database = {
  public: {
    Tables: {
      alert_acknowledgements: {
        Row: {
          acknowledged_at: string;
          alert_type: AlertType;
          condition_fingerprint: string;
          source_id: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          acknowledged_at?: string;
          alert_type: AlertType;
          condition_fingerprint: string;
          source_id: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          acknowledged_at?: string;
          alert_type?: AlertType;
          condition_fingerprint?: string;
          source_id?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alert_acknowledgements_member_fkey";
            columns: ["workspace_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          contact_name: string | null;
          created_at: string;
          created_by: string;
          email: string | null;
          id: string;
          is_active: boolean;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          address?: string | null;
          contact_name?: string | null;
          created_at?: string;
          created_by: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          address?: string | null;
          contact_name?: string | null;
          created_at?: string;
          created_by?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_created_member_fkey";
            columns: ["workspace_id", "created_by"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "customers_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_ups: {
        Row: {
          assigned_to: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          created_by: string;
          customer_id: string;
          due_date: string;
          due_time: string | null;
          id: string;
          notes: string | null;
          outcome: string | null;
          status: FollowUpStatus;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by: string;
          customer_id: string;
          due_date: string;
          due_time?: string | null;
          id?: string;
          notes?: string | null;
          outcome?: string | null;
          status?: FollowUpStatus;
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          assigned_to?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by?: string;
          customer_id?: string;
          due_date?: string;
          due_time?: string | null;
          id?: string;
          notes?: string | null;
          outcome?: string | null;
          status?: FollowUpStatus;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follow_ups_assigned_member_fkey";
            columns: ["workspace_id", "assigned_to"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "follow_ups_completed_member_fkey";
            columns: ["workspace_id", "completed_by"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "follow_ups_created_member_fkey";
            columns: ["workspace_id", "created_by"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "follow_ups_customer_fkey";
            columns: ["workspace_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "follow_ups_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_items: {
        Row: {
          category: string | null;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          reorder_threshold: number;
          sku: string | null;
          unit_of_measure: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          reorder_threshold?: number;
          sku?: string | null;
          unit_of_measure: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          reorder_threshold?: number;
          sku?: string | null;
          unit_of_measure?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_created_member_fkey";
            columns: ["workspace_id", "created_by"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "inventory_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          created_at: string;
          id: string;
          inventory_item_id: string;
          movement_type: InventoryMovementType;
          note: string | null;
          quantity_change: number;
          recorded_by: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          inventory_item_id: string;
          movement_type: InventoryMovementType;
          note?: string | null;
          quantity_change: number;
          recorded_by: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          inventory_item_id?: string;
          movement_type?: InventoryMovementType;
          note?: string | null;
          quantity_change?: number;
          recorded_by?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_fkey";
            columns: ["workspace_id", "inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "inventory_movements_recorded_member_fkey";
            columns: ["workspace_id", "recorded_by"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "inventory_movements_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          due_date: string | null;
          id: string;
          priority: TaskPriority;
          status: TaskStatus;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: TaskPriority;
          status?: TaskStatus;
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: TaskPriority;
          status?: TaskStatus;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_member_fkey";
            columns: ["workspace_id", "assigned_to"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "tasks_created_member_fkey";
            columns: ["workspace_id", "created_by"];
            isOneToOne: false;
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          created_at: string;
          deactivated_at: string | null;
          deactivated_by: string | null;
          display_name: string;
          role: WorkspaceRole;
          status: WorkspaceMemberStatus;
          updated_at: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          deactivated_at?: string | null;
          deactivated_by?: string | null;
          display_name?: string;
          role?: WorkspaceRole;
          status?: WorkspaceMemberStatus;
          updated_at?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          deactivated_at?: string | null;
          deactivated_by?: string | null;
          display_name?: string;
          role?: WorkspaceRole;
          status?: WorkspaceMemberStatus;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          activation_mode: WorkspaceInvitationActivationMode | null;
          auth_user_id: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          created_by: string;
          display_name: string;
          email: string;
          expires_at: string;
          id: string;
          last_error_code: string | null;
          last_sent_at: string | null;
          role: "member";
          send_count: number;
          status: WorkspaceInvitationStatus;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          activation_mode?: WorkspaceInvitationActivationMode | null;
          auth_user_id?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by: string;
          display_name: string;
          email: string;
          expires_at: string;
          id?: string;
          last_error_code?: string | null;
          last_sent_at?: string | null;
          role?: "member";
          send_count?: number;
          status?: WorkspaceInvitationStatus;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          activation_mode?: WorkspaceInvitationActivationMode | null;
          auth_user_id?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string;
          display_name?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          last_error_code?: string | null;
          last_sent_at?: string | null;
          role?: "member";
          send_count?: number;
          status?: WorkspaceInvitationStatus;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          name: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      inventory_item_balances: {
        Row: {
          category: string | null;
          created_at: string;
          created_by: string;
          current_quantity: number;
          id: string;
          is_low_stock: boolean;
          last_movement_at: string | null;
          movement_count: number;
          name: string;
          reorder_threshold: number;
          sku: string | null;
          unit_of_measure: string;
          updated_at: string;
          workspace_id: string;
        };
        Relationships: [];
      };
      operations_attention_items: {
        Row: {
          action_path: string;
          alert_type: AlertType;
          assigned_to: string | null;
          condition_fingerprint: string;
          detail: string;
          effective_date: string;
          severity: AlertSeverity;
          sort_rank: number;
          source_id: string;
          source_type: AttentionSourceType;
          source_updated_at: string;
          title: string;
          workspace_id: string;
        };
        Relationships: [];
      };
      workspace_invitation_lifecycle: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          activation_mode: WorkspaceInvitationActivationMode | null;
          auth_user_id: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          created_by: string;
          display_name: string;
          email: string;
          expires_at: string;
          id: string;
          last_error_code: string | null;
          last_sent_at: string | null;
          lifecycle_status: "accepted" | "cancelled" | "expired" | "pending";
          role: "member";
          send_count: number;
          status: WorkspaceInvitationStatus;
          updated_at: string;
          workspace_id: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_workspace_invitation: {
        Args: { target_invitation_id: string };
        Returns: string;
      };
      cancel_workspace_invitation: {
        Args: { target_invitation_id: string };
        Returns: boolean;
      };
      create_workspace_invitation: {
        Args: { invitation_display_name: string; invitation_email: string };
        Returns: string;
      };
      create_inventory_item_with_opening_stock: {
        Args: {
          item_category: string | null;
          item_name: string;
          item_reorder_threshold: number;
          item_sku: string | null;
          item_unit_of_measure: string;
          opening_quantity?: number;
          target_workspace_id: string;
        };
        Returns: string;
      };
      deactivate_workspace_member: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      get_current_workspace_invitation: {
        Args: Record<string, never>;
        Returns: {
          activation_mode: WorkspaceInvitationActivationMode | null;
          display_name: string;
          email: string;
          expires_at: string;
          invitation_id: string;
          lifecycle_status: "expired" | "pending";
          workspace_id: string;
          workspace_name: string;
        }[];
      };
      reactivate_workspace_member: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      record_workspace_invitation_error: {
        Args: {
          sanitized_error_code: string;
          target_auth_user_id: string | null;
          target_invitation_id: string;
        };
        Returns: boolean;
      };
      record_workspace_invitation_send: {
        Args: {
          target_activation_mode: WorkspaceInvitationActivationMode;
          target_auth_user_id: string;
          target_invitation_id: string;
        };
        Returns: boolean;
      };
      update_workspace_member_display_name: {
        Args: { new_display_name: string; target_user_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"];
export type WorkspaceInvitation = Database["public"]["Tables"]["workspace_invitations"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
export type InventoryMovement = Database["public"]["Tables"]["inventory_movements"]["Row"];
export type InventoryItemBalance = Database["public"]["Views"]["inventory_item_balances"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type FollowUp = Database["public"]["Tables"]["follow_ups"]["Row"];
export type AlertAcknowledgement =
  Database["public"]["Tables"]["alert_acknowledgements"]["Row"];
export type OperationsAttentionItem =
  Database["public"]["Views"]["operations_attention_items"]["Row"];
