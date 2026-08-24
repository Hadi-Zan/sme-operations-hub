export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WorkspaceRole = "member" | "owner";
export type TaskPriority = "high" | "low" | "medium" | "urgent";
export type TaskStatus = "completed" | "in_progress" | "todo";
export type InventoryMovementType = "adjustment" | "stock_in" | "stock_out";

export type Database = {
  public: {
    Tables: {
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
          display_name: string;
          role: WorkspaceRole;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          role?: WorkspaceRole;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          role?: WorkspaceRole;
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
    };
    Functions: {
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
export type InventoryMovement = Database["public"]["Tables"]["inventory_movements"]["Row"];
export type InventoryItemBalance = Database["public"]["Views"]["inventory_item_balances"]["Row"];
