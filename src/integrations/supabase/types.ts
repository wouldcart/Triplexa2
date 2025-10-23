export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_settings: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          notification_settings: Json | null
          preferences: Json | null
          security_settings: Json | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          notification_settings?: Json | null
          preferences?: Json | null
          security_settings?: Json | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          notification_settings?: Json | null
          preferences?: Json | null
          security_settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agency_code: string | null
          agency_name: string | null
          business_address: string | null
          business_phone: string | null
          commission_structure: Json | null
          created_at: string
          iata_number: string | null
          id: string
          license_number: string | null
          specializations: string[] | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agency_code?: string | null
          agency_name?: string | null
          business_address?: string | null
          business_phone?: string | null
          commission_structure?: Json | null
          created_at?: string
          iata_number?: string | null
          id?: string
          license_number?: string | null
          specializations?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agency_code?: string | null
          agency_name?: string | null
          business_address?: string | null
          business_phone?: string | null
          commission_structure?: Json | null
          created_at?: string
          iata_number?: string | null
          id?: string
          license_number?: string | null
          specializations?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          created_at: string | null
          data_type: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          setting_json: Json | null
          setting_key: string
          setting_value: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          setting_json?: Json | null
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          setting_json?: Json | null
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_id: string
          created_at: string | null
          has_airport: boolean | null
          id: string
          is_popular: boolean | null
          name: string
          region: string
          status: string
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          has_airport?: boolean | null
          id?: string
          is_popular?: boolean | null
          name: string
          region: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          has_airport?: boolean | null
          id?: string
          is_popular?: boolean | null
          name?: string
          region?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          continent: string
          created_at: string | null
          currency: string
          currency_symbol: string
          flag_url: string | null
          id: string
          is_popular: boolean | null
          languages: Json | null
          name: string
          pricing_currency: string | null
          pricing_currency_override: boolean | null
          pricing_currency_symbol: string | null
          region: string
          status: string
          updated_at: string | null
          visa_required: boolean | null
        }
        Insert: {
          code: string
          continent: string
          created_at?: string | null
          currency: string
          currency_symbol: string
          flag_url?: string | null
          id?: string
          is_popular?: boolean | null
          languages?: Json | null
          name: string
          pricing_currency?: string | null
          pricing_currency_override?: boolean | null
          pricing_currency_symbol?: string | null
          region: string
          status?: string
          updated_at?: string | null
          visa_required?: boolean | null
        }
        Update: {
          code?: string
          continent?: string
          created_at?: string | null
          currency?: string
          currency_symbol?: string
          flag_url?: string | null
          id?: string
          is_popular?: boolean | null
          languages?: Json | null
          name?: string
          pricing_currency?: string | null
          pricing_currency_override?: boolean | null
          pricing_currency_symbol?: string | null
          region?: string
          status?: string
          updated_at?: string | null
          visa_required?: boolean | null
        }
        Relationships: []
      }
      dashboard_alerts: {
        Row: {
          created_at: string
          details: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          type?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          type?: string
        }
        Relationships: []
      }
      dashboard_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          notes: string | null
          priority: string
          related_booking_id: string | null
          related_enquiry_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          notes?: string | null
          priority?: string
          related_booking_id?: string | null
          related_enquiry_id?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          priority?: string
          related_booking_id?: string | null
          related_enquiry_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "sales_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_related_enquiry_id_fkey"
            columns: ["related_enquiry_id"]
            isOneToOne: false
            referencedRelation: "sales_enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_room_types: {
        Row: {
          adult_price: number
          amenities: Json | null
          capacity: Json
          child_price: number
          configuration: string | null
          created_at: string | null
          description: string | null
          external_id: number | null
          extra_bed_price: number
          hotel_id: string
          id: string
          images: Json | null
          meal_plan: string | null
          name: string
          status: string
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          adult_price?: number
          amenities?: Json | null
          capacity: Json
          child_price?: number
          configuration?: string | null
          created_at?: string | null
          description?: string | null
          external_id?: number | null
          extra_bed_price?: number
          hotel_id: string
          id?: string
          images?: Json | null
          meal_plan?: string | null
          name: string
          status?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          adult_price?: number
          amenities?: Json | null
          capacity?: Json
          child_price?: number
          configuration?: string | null
          created_at?: string | null
          description?: string | null
          external_id?: number | null
          extra_bed_price?: number
          hotel_id?: string
          id?: string
          images?: Json | null
          meal_plan?: string | null
          name?: string
          status?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_room_types_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: Json | null
          amenities: Json | null
          category: string | null
          check_in_time: string | null
          check_out_time: string | null
          city: string
          contact_info: Json | null
          country: string
          created_at: string | null
          description: string | null
          external_id: number | null
          facilities: Json | null
          google_map_link: string | null
          id: string
          images: Json | null
          last_updated: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          policies: Json | null
          star_rating: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          amenities?: Json | null
          category?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city: string
          contact_info?: Json | null
          country: string
          created_at?: string | null
          description?: string | null
          external_id?: number | null
          facilities?: Json | null
          google_map_link?: string | null
          id?: string
          images?: Json | null
          last_updated?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          policies?: Json | null
          star_rating?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          amenities?: Json | null
          category?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string
          contact_info?: Json | null
          country?: string
          created_at?: string | null
          description?: string | null
          external_id?: number | null
          facilities?: Json | null
          google_map_link?: string | null
          id?: string
          images?: Json | null
          last_updated?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          policies?: Json | null
          star_rating?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      intermediate_stops: {
        Row: {
          coordinates: Json | null
          created_at: string | null
          full_name: string
          id: string
          location_code: string
          luggage_capacity: Json | null
          route_id: string
          stop_order: number
          transfer_method_notes: string | null
          updated_at: string | null
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string | null
          full_name: string
          id?: string
          location_code: string
          luggage_capacity?: Json | null
          route_id: string
          stop_order: number
          transfer_method_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          coordinates?: Json | null
          created_at?: string | null
          full_name?: string
          id?: string
          location_code?: string
          luggage_capacity?: Json | null
          route_id?: string
          stop_order?: number
          transfer_method_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intermediate_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      location_codes: {
        Row: {
          category: string
          city: string
          code: string
          country: string
          created_at: string
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          city: string
          code: string
          country: string
          created_at?: string
          full_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          city?: string
          code?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_activity: {
        Row: {
          id: string
          ip_address: string | null
          login_time: string
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_time?: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_time?: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          department: string | null
          email: string
          employee_id: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          employee_id?: string | null
          id: string
          name: string
          phone?: string | null
          position?: string | null
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proposal_templates: {
        Row: {
          category: string
          created_at: string | null
          day_plan: Json | null
          description: string | null
          destination: Json
          duration: Json
          external_id: string | null
          id: string
          metadata: Json | null
          name: string
          pricing_matrix: Json | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          day_plan?: Json | null
          description?: string | null
          destination: Json
          duration: Json
          external_id?: string | null
          id?: string
          metadata?: Json | null
          name: string
          pricing_matrix?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          day_plan?: Json | null
          description?: string | null
          destination?: Json
          duration?: Json
          external_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          pricing_matrix?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string
          area: string | null
          average_cost: number
          average_price: number | null
          city: string
          closing_time: string | null
          contact: string | null
          country: string
          created_at: string | null
          cuisine: string | null
          cuisine_types: Json | null
          currency_code: string | null
          currency_symbol: string | null
          description: string | null
          dietary_options: Json
          external_id: string | null
          features: Json
          id: string
          image_url: string | null
          images: Json | null
          is_preferred: boolean | null
          location: string | null
          meal_types: Json
          name: string
          opening_hours: string | null
          opening_time: string | null
          price_category: string
          price_range: string | null
          rating: number | null
          review_count: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address: string
          area?: string | null
          average_cost: number
          average_price?: number | null
          city: string
          closing_time?: string | null
          contact?: string | null
          country: string
          created_at?: string | null
          cuisine?: string | null
          cuisine_types?: Json | null
          currency_code?: string | null
          currency_symbol?: string | null
          description?: string | null
          dietary_options: Json
          external_id?: string | null
          features: Json
          id?: string
          image_url?: string | null
          images?: Json | null
          is_preferred?: boolean | null
          location?: string | null
          meal_types: Json
          name: string
          opening_hours?: string | null
          opening_time?: string | null
          price_category: string
          price_range?: string | null
          rating?: number | null
          review_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          area?: string | null
          average_cost?: number
          average_price?: number | null
          city?: string
          closing_time?: string | null
          contact?: string | null
          country?: string
          created_at?: string | null
          cuisine?: string | null
          cuisine_types?: Json | null
          currency_code?: string | null
          currency_symbol?: string | null
          description?: string | null
          dietary_options?: Json
          external_id?: string | null
          features?: Json
          id?: string
          image_url?: string | null
          images?: Json | null
          is_preferred?: boolean | null
          location?: string | null
          meal_types?: Json
          name?: string
          opening_hours?: string | null
          opening_time?: string | null
          price_category?: string
          price_range?: string | null
          rating?: number | null
          review_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_bookings: {
        Row: {
          balance_amount: number
          booking_date: string
          booking_id: string
          client_name: string
          commission: number | null
          contact_person: string
          created_at: string
          created_by: string | null
          currency: string | null
          destination: string
          duration: string | null
          email: string
          enquiry_id: string | null
          id: string
          paid_amount: number
          payment_status: string | null
          phone: string
          status: string
          total_amount: number
          travel_date: string | null
          travelers: number
          updated_at: string
        }
        Insert: {
          balance_amount?: number
          booking_date?: string
          booking_id: string
          client_name: string
          commission?: number | null
          contact_person: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          destination: string
          duration?: string | null
          email: string
          enquiry_id?: string | null
          id?: string
          paid_amount?: number
          payment_status?: string | null
          phone: string
          status?: string
          total_amount?: number
          travel_date?: string | null
          travelers?: number
          updated_at?: string
        }
        Update: {
          balance_amount?: number
          booking_date?: string
          booking_id?: string
          client_name?: string
          commission?: number | null
          contact_person?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          destination?: string
          duration?: string | null
          email?: string
          enquiry_id?: string | null
          id?: string
          paid_amount?: number
          payment_status?: string | null
          phone?: string
          status?: string
          total_amount?: number
          travel_date?: string | null
          travelers?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_bookings_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "sales_enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_enquiries: {
        Row: {
          assigned_to: string | null
          budget: number | null
          budget_currency: string | null
          client_name: string
          contact_person: string
          created_at: string
          created_by: string | null
          date_received: string
          destination: string
          duration: string | null
          email: string
          enquiry_id: string
          follow_up_date: string | null
          id: string
          phone: string
          priority: string
          requirements: string | null
          status: string
          travelers: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          budget_currency?: string | null
          client_name: string
          contact_person: string
          created_at?: string
          created_by?: string | null
          date_received?: string
          destination: string
          duration?: string | null
          email: string
          enquiry_id: string
          follow_up_date?: string | null
          id?: string
          phone: string
          priority?: string
          requirements?: string | null
          status?: string
          travelers?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          budget_currency?: string | null
          client_name?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          date_received?: string
          destination?: string
          duration?: string | null
          email?: string
          enquiry_id?: string
          follow_up_date?: string | null
          id?: string
          phone?: string
          priority?: string
          requirements?: string | null
          status?: string
          travelers?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_leads: {
        Row: {
          assigned_to: string | null
          company_name: string
          contact_person: string
          created_at: string
          created_by: string | null
          email: string
          estimated_currency: string | null
          estimated_value: number | null
          id: string
          lead_id: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          phone: string | null
          priority: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_name: string
          contact_person: string
          created_at?: string
          created_by?: string | null
          email: string
          estimated_currency?: string | null
          estimated_value?: number | null
          id?: string
          lead_id: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_name?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          email?: string
          estimated_currency?: string | null
          estimated_value?: number | null
          id?: string
          lead_id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_quotes: {
        Row: {
          client_name: string
          created_at: string
          created_by: string | null
          currency: string | null
          destination: string
          enquiry_id: string | null
          id: string
          quote_data: Json | null
          quote_id: string
          status: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_name: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          destination: string
          enquiry_id?: string | null
          id?: string
          quote_data?: Json | null
          quote_id: string
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          destination?: string
          enquiry_id?: string | null
          id?: string
          quote_data?: Json | null
          quote_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_quotes_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "sales_enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      sightseeing: {
        Row: {
          activities: string[] | null
          address: string | null
          allowed_age_group: string | null
          category: string | null
          city: string
          country: string
          created_at: string | null
          days_of_week: string[] | null
          description: string | null
          difficulty_level: string | null
          duration: string | null
          external_id: number | null
          google_map_link: string | null
          group_size_options: Json | null
          id: string
          images: Json | null
          is_free: boolean | null
          last_updated: string | null
          latitude: number | null
          longitude: number | null
          name: string
          package_options: Json | null
          pickup_time: string | null
          policies: Json | null
          price: Json | null
          pricing_options: Json | null
          requires_mandatory_transfer: boolean | null
          season: string | null
          sic_available: boolean | null
          sic_pricing: Json | null
          status: string
          timing: string | null
          transfer_mandatory: boolean | null
          transfer_options: Json | null
          updated_at: string | null
          validity_period: Json | null
        }
        Insert: {
          activities?: string[] | null
          address?: string | null
          allowed_age_group?: string | null
          category?: string | null
          city: string
          country: string
          created_at?: string | null
          days_of_week?: string[] | null
          description?: string | null
          difficulty_level?: string | null
          duration?: string | null
          external_id?: number | null
          google_map_link?: string | null
          group_size_options?: Json | null
          id?: string
          images?: Json | null
          is_free?: boolean | null
          last_updated?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          package_options?: Json | null
          pickup_time?: string | null
          policies?: Json | null
          price?: Json | null
          pricing_options?: Json | null
          requires_mandatory_transfer?: boolean | null
          season?: string | null
          sic_available?: boolean | null
          sic_pricing?: Json | null
          status?: string
          timing?: string | null
          transfer_mandatory?: boolean | null
          transfer_options?: Json | null
          updated_at?: string | null
          validity_period?: Json | null
        }
        Update: {
          activities?: string[] | null
          address?: string | null
          allowed_age_group?: string | null
          category?: string | null
          city?: string
          country?: string
          created_at?: string | null
          days_of_week?: string[] | null
          description?: string | null
          difficulty_level?: string | null
          duration?: string | null
          external_id?: number | null
          google_map_link?: string | null
          group_size_options?: Json | null
          id?: string
          images?: Json | null
          is_free?: boolean | null
          last_updated?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          package_options?: Json | null
          pickup_time?: string | null
          policies?: Json | null
          price?: Json | null
          pricing_options?: Json | null
          requires_mandatory_transfer?: boolean | null
          season?: string | null
          sic_available?: boolean | null
          sic_pricing?: Json | null
          status?: string
          timing?: string | null
          transfer_mandatory?: boolean | null
          transfer_options?: Json | null
          updated_at?: string | null
          validity_period?: Json | null
        }
        Relationships: []
      }
      sightseeing_options: {
        Row: {
          additional_charges: number | null
          adult_price: number
          child_price: number
          created_at: string | null
          description: string | null
          id: string
          location: string
          route_id: string
          updated_at: string | null
        }
        Insert: {
          additional_charges?: number | null
          adult_price: number
          child_price: number
          created_at?: string | null
          description?: string | null
          id?: string
          location: string
          route_id: string
          updated_at?: string | null
        }
        Update: {
          additional_charges?: number | null
          adult_price?: number
          child_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string
          route_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sightseeing_options_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_packages: {
        Row: {
          banners: Json | null
          base_cost: number
          cancellation_policy: string | null
          commission: number | null
          created_at: string | null
          currency: string
          days: number
          departure_date: string | null
          description: string | null
          destinations: Json | null
          end_city: string | null
          exclusions: string | null
          external_id: string | null
          final_price: number
          id: string
          inclusions: string | null
          is_fixed_departure: boolean | null
          itinerary: Json | null
          markup: number
          max_pax: number | null
          min_pax: number
          name: string
          nights: number
          package_type: string
          payment_policy: string | null
          price_per_person: number
          return_date: string | null
          start_city: string | null
          status: string
          summary: string | null
          themes: Json | null
          total_seats: number | null
          updated_at: string | null
        }
        Insert: {
          banners?: Json | null
          base_cost?: number
          cancellation_policy?: string | null
          commission?: number | null
          created_at?: string | null
          currency: string
          days: number
          departure_date?: string | null
          description?: string | null
          destinations?: Json | null
          end_city?: string | null
          exclusions?: string | null
          external_id?: string | null
          final_price?: number
          id?: string
          inclusions?: string | null
          is_fixed_departure?: boolean | null
          itinerary?: Json | null
          markup?: number
          max_pax?: number | null
          min_pax: number
          name: string
          nights: number
          package_type: string
          payment_policy?: string | null
          price_per_person?: number
          return_date?: string | null
          start_city?: string | null
          status?: string
          summary?: string | null
          themes?: Json | null
          total_seats?: number | null
          updated_at?: string | null
        }
        Update: {
          banners?: Json | null
          base_cost?: number
          cancellation_policy?: string | null
          commission?: number | null
          created_at?: string | null
          currency?: string
          days?: number
          departure_date?: string | null
          description?: string | null
          destinations?: Json | null
          end_city?: string | null
          exclusions?: string | null
          external_id?: string | null
          final_price?: number
          id?: string
          inclusions?: string | null
          is_fixed_departure?: boolean | null
          itinerary?: Json | null
          markup?: number
          max_pax?: number | null
          min_pax?: number
          name?: string
          nights?: number
          package_type?: string
          payment_policy?: string | null
          price_per_person?: number
          return_date?: string | null
          start_city?: string | null
          status?: string
          summary?: string | null
          themes?: Json | null
          total_seats?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transport_routes: {
        Row: {
          country: string | null
          created_at: string | null
          distance: number | null
          duration: string | null
          enable_sightseeing: boolean
          end_coordinates: Json | null
          end_location: string
          end_location_full_name: string | null
          id: string
          luggage_capacity: Json | null
          name: string
          notes: string | null
          route_code: string
          route_name: string
          start_coordinates: Json | null
          start_location: string
          start_location_full_name: string | null
          status: string
          transfer_type: string
          updated_at: string | null
          vehicle_types: Json | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          distance?: number | null
          duration?: string | null
          enable_sightseeing?: boolean
          end_coordinates?: Json | null
          end_location: string
          end_location_full_name?: string | null
          id?: string
          luggage_capacity?: Json | null
          name?: string
          notes?: string | null
          route_code: string
          route_name: string
          start_coordinates?: Json | null
          start_location: string
          start_location_full_name?: string | null
          status?: string
          transfer_type: string
          updated_at?: string | null
          vehicle_types?: Json | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          distance?: number | null
          duration?: string | null
          enable_sightseeing?: boolean
          end_coordinates?: Json | null
          end_location?: string
          end_location_full_name?: string | null
          id?: string
          luggage_capacity?: Json | null
          name?: string
          notes?: string | null
          route_code?: string
          route_name?: string
          start_coordinates?: Json | null
          start_location?: string
          start_location_full_name?: string | null
          status?: string
          transfer_type?: string
          updated_at?: string | null
          vehicle_types?: Json | null
        }
        Relationships: []
      }
      transport_types: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          created_by: string | null
          id: string
          luggage_capacity: number | null
          name: string
          seating_capacity: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          luggage_capacity?: number | null
          name: string
          seating_capacity?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          luggage_capacity?: number | null
          name?: string
          seating_capacity?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          permissions: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      visa: {
        Row: {
          country: string
          created_at: string | null
          documents: Json | null
          id: string
          is_rush_available: boolean | null
          price: number | null
          processing_time: string | null
          requirements: string | null
          rush_price: number | null
          rush_processing_time: string | null
          status: string
          updated_at: string | null
          validity: string | null
          visa_type: string
        }
        Insert: {
          country: string
          created_at?: string | null
          documents?: Json | null
          id?: string
          is_rush_available?: boolean | null
          price?: number | null
          processing_time?: string | null
          requirements?: string | null
          rush_price?: number | null
          rush_processing_time?: string | null
          status?: string
          updated_at?: string | null
          validity?: string | null
          visa_type: string
        }
        Update: {
          country?: string
          created_at?: string | null
          documents?: Json | null
          id?: string
          is_rush_available?: boolean | null
          price?: number | null
          processing_time?: string | null
          requirements?: string | null
          rush_price?: number | null
          rush_processing_time?: string | null
          status?: string
          updated_at?: string | null
          validity?: string | null
          visa_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      cities_with_country: {
        Row: {
          country_code: string | null
          country_id: string | null
          country_name: string | null
          created_at: string | null
          has_airport: boolean | null
          id: string | null
          is_popular: boolean | null
          name: string | null
          region: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_missing_agent_records: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
