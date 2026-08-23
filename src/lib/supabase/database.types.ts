export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WorkspaceRole = "member" | "owner";

export type Database = {
  public: {
    Tables: {
      workspace_members: {
        Row: {
          created_at: string;
          role: WorkspaceRole;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          role?: WorkspaceRole;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
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
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
