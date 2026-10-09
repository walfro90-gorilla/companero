
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "avances": {
                  Row: {
                    "completada_en": string,"empresa_id": string,"leccion_id": string,"modulo_id": string,"usuario_id": string
                  }
                  Insert: {
                    "completada_en"?: string,"empresa_id": string,"leccion_id": string,"modulo_id": string,"usuario_id": string
                  }
                  Update: {
                    "completada_en"?: string,"empresa_id"?: string,"leccion_id"?: string,"modulo_id"?: string,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "avances_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avances_leccion_id_fkey"
      columns: ["leccion_id"]
isOneToOne: false
      referencedRelation: "lecciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "avances_modulo_id_fkey"
      columns: ["modulo_id"]
isOneToOne: false
      referencedRelation: "modulos"
      referencedColumns: ["id"]
    }
                  ]
                },"canalizaciones": {
                  Row: {
                    "atendida_en": string | null,"atendida_por": string | null,"consulta_id": string | null,"creada_en": string,"destino": Database["public"]['Enums']["destino_canalizacion"],"empresa_id": string,"estado": string,"id": string,"pregunta": string,"respuesta": string | null,"sucursal_id": string | null,"usuario_id": string
                  }
                  Insert: {
                    "atendida_en"?: string | null,"atendida_por"?: string | null,"consulta_id"?: string | null,"creada_en"?: string,"destino": Database["public"]['Enums']["destino_canalizacion"],"empresa_id": string,"estado"?: string,"id"?: string,"pregunta": string,"respuesta"?: string | null,"sucursal_id"?: string | null,"usuario_id": string
                  }
                  Update: {
                    "atendida_en"?: string | null,"atendida_por"?: string | null,"consulta_id"?: string | null,"creada_en"?: string,"destino"?: Database["public"]['Enums']["destino_canalizacion"],"empresa_id"?: string,"estado"?: string,"id"?: string,"pregunta"?: string,"respuesta"?: string | null,"sucursal_id"?: string | null,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "canalizaciones_consulta_id_fkey"
      columns: ["consulta_id"]
isOneToOne: false
      referencedRelation: "consultas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "canalizaciones_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "canalizaciones_sucursal_id_fkey"
      columns: ["sucursal_id"]
isOneToOne: false
      referencedRelation: "sucursales"
      referencedColumns: ["id"]
    }
                  ]
                },"consultas": {
                  Row: {
                    "canalizada": Database["public"]['Enums']["destino_canalizacion"] | null,"citas": (string)[],"consultadas": (string)[],"creada_en": string,"empresa_id": string,"id": string,"invalidas": (string)[],"pregunta": string,"proveedor": string | null,"respuesta": string | null,"sucursal_id": string | null,"usuario_id": string
                  }
                  Insert: {
                    "canalizada"?: Database["public"]['Enums']["destino_canalizacion"] | null,"citas"?: (string)[],"consultadas"?: (string)[],"creada_en"?: string,"empresa_id": string,"id"?: string,"invalidas"?: (string)[],"pregunta": string,"proveedor"?: string | null,"respuesta"?: string | null,"sucursal_id"?: string | null,"usuario_id": string
                  }
                  Update: {
                    "canalizada"?: Database["public"]['Enums']["destino_canalizacion"] | null,"citas"?: (string)[],"consultadas"?: (string)[],"creada_en"?: string,"empresa_id"?: string,"id"?: string,"invalidas"?: (string)[],"pregunta"?: string,"proveedor"?: string | null,"respuesta"?: string | null,"sucursal_id"?: string | null,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consultas_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultas_sucursal_id_fkey"
      columns: ["sucursal_id"]
isOneToOne: false
      referencedRelation: "sucursales"
      referencedColumns: ["id"]
    }
                  ]
                },"documentos": {
                  Row: {
                    "actualizado_en": string,"archivo": string | null,"creado_en": string,"creado_por": string | null,"ejemplo": boolean,"empresa_id": string,"estado": Database["public"]['Enums']["estado_contenido"],"fuente": string | null,"id": string,"numero": number,"puesto_id": string | null,"tipo": string,"titulo": string
                  }
                  Insert: {
                    "actualizado_en"?: string,"archivo"?: string | null,"creado_en"?: string,"creado_por"?: string | null,"ejemplo"?: boolean,"empresa_id": string,"estado"?: Database["public"]['Enums']["estado_contenido"],"fuente"?: string | null,"id"?: string,"numero"?: number,"puesto_id"?: string | null,"tipo"?: string,"titulo": string
                  }
                  Update: {
                    "actualizado_en"?: string,"archivo"?: string | null,"creado_en"?: string,"creado_por"?: string | null,"ejemplo"?: boolean,"empresa_id"?: string,"estado"?: Database["public"]['Enums']["estado_contenido"],"fuente"?: string | null,"id"?: string,"numero"?: number,"puesto_id"?: string | null,"tipo"?: string,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "documentos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documentos_puesto_id_fkey"
      columns: ["puesto_id"]
isOneToOne: false
      referencedRelation: "puestos"
      referencedColumns: ["id"]
    }
                  ]
                },"empresas": {
                  Row: {
                    "avatar": NonNullable<Json>,"creada_en": string,"creada_por": string | null,"giro": string | null,"id": string,"nombre": string,"slug": string
                  }
                  Insert: {
                    "avatar"?: NonNullable<Json>,"creada_en"?: string,"creada_por"?: string | null,"giro"?: string | null,"id"?: string,"nombre": string,"slug": string
                  }
                  Update: {
                    "avatar"?: NonNullable<Json>,"creada_en"?: string,"creada_por"?: string | null,"giro"?: string | null,"id"?: string,"nombre"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"escenarios": {
                  Row: {
                    "empresa_id": string,"id": string,"modulo_id": string,"objetivo": string,"orden": number,"personaje": string,"secciones": (string)[],"situacion": string,"titulo": string
                  }
                  Insert: {
                    "empresa_id": string,"id"?: string,"modulo_id": string,"objetivo": string,"orden": number,"personaje": string,"secciones"?: (string)[],"situacion": string,"titulo": string
                  }
                  Update: {
                    "empresa_id"?: string,"id"?: string,"modulo_id"?: string,"objetivo"?: string,"orden"?: number,"personaje"?: string,"secciones"?: (string)[],"situacion"?: string,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "escenarios_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "escenarios_modulo_id_fkey"
      columns: ["modulo_id"]
isOneToOne: false
      referencedRelation: "modulos"
      referencedColumns: ["id"]
    }
                  ]
                },"intentos": {
                  Row: {
                    "aciertos": number,"creado_en": string,"empresa_id": string,"id": string,"modulo_id": string,"respuestas": NonNullable<Json>,"total": number,"usuario_id": string
                  }
                  Insert: {
                    "aciertos": number,"creado_en"?: string,"empresa_id": string,"id"?: string,"modulo_id": string,"respuestas": NonNullable<Json>,"total": number,"usuario_id": string
                  }
                  Update: {
                    "aciertos"?: number,"creado_en"?: string,"empresa_id"?: string,"id"?: string,"modulo_id"?: string,"respuestas"?: NonNullable<Json>,"total"?: number,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "intentos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "intentos_modulo_id_fkey"
      columns: ["modulo_id"]
isOneToOne: false
      referencedRelation: "modulos"
      referencedColumns: ["id"]
    }
                  ]
                },"invitaciones": {
                  Row: {
                    "aceptada_en": string | null,"creada_en": string,"creada_por": string | null,"email": string,"empresa_id": string,"id": string,"puesto_id": string | null,"rol": Database["public"]['Enums']["rol_miembro"],"sucursal_id": string | null
                  }
                  Insert: {
                    "aceptada_en"?: string | null,"creada_en"?: string,"creada_por"?: string | null,"email": string,"empresa_id": string,"id"?: string,"puesto_id"?: string | null,"rol"?: Database["public"]['Enums']["rol_miembro"],"sucursal_id"?: string | null
                  }
                  Update: {
                    "aceptada_en"?: string | null,"creada_en"?: string,"creada_por"?: string | null,"email"?: string,"empresa_id"?: string,"id"?: string,"puesto_id"?: string | null,"rol"?: Database["public"]['Enums']["rol_miembro"],"sucursal_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitaciones_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitaciones_puesto_id_fkey"
      columns: ["puesto_id"]
isOneToOne: false
      referencedRelation: "puestos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitaciones_sucursal_id_fkey"
      columns: ["sucursal_id"]
isOneToOne: false
      referencedRelation: "sucursales"
      referencedColumns: ["id"]
    }
                  ]
                },"lecciones": {
                  Row: {
                    "contenido": string,"empresa_id": string,"id": string,"modulo_id": string,"objetivo": string | null,"orden": number,"secciones": (string)[],"titulo": string
                  }
                  Insert: {
                    "contenido": string,"empresa_id": string,"id"?: string,"modulo_id": string,"objetivo"?: string | null,"orden": number,"secciones"?: (string)[],"titulo": string
                  }
                  Update: {
                    "contenido"?: string,"empresa_id"?: string,"id"?: string,"modulo_id"?: string,"objetivo"?: string | null,"orden"?: number,"secciones"?: (string)[],"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lecciones_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lecciones_modulo_id_fkey"
      columns: ["modulo_id"]
isOneToOne: false
      referencedRelation: "modulos"
      referencedColumns: ["id"]
    }
                  ]
                },"miembros": {
                  Row: {
                    "creado_en": string,"empresa_id": string,"ingreso": string,"nombre": string | null,"puesto_id": string | null,"rol": Database["public"]['Enums']["rol_miembro"],"sucursal_id": string | null,"usuario_id": string
                  }
                  Insert: {
                    "creado_en"?: string,"empresa_id": string,"ingreso"?: string,"nombre"?: string | null,"puesto_id"?: string | null,"rol"?: Database["public"]['Enums']["rol_miembro"],"sucursal_id"?: string | null,"usuario_id": string
                  }
                  Update: {
                    "creado_en"?: string,"empresa_id"?: string,"ingreso"?: string,"nombre"?: string | null,"puesto_id"?: string | null,"rol"?: Database["public"]['Enums']["rol_miembro"],"sucursal_id"?: string | null,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "miembros_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "miembros_puesto_id_fkey"
      columns: ["puesto_id"]
isOneToOne: false
      referencedRelation: "puestos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "miembros_sucursal_id_fkey"
      columns: ["sucursal_id"]
isOneToOne: false
      referencedRelation: "sucursales"
      referencedColumns: ["id"]
    }
                  ]
                },"modulos": {
                  Row: {
                    "actualizado_en": string,"creado_en": string,"creado_por": string | null,"descripcion": string | null,"empresa_id": string,"estado": Database["public"]['Enums']["estado_contenido"],"generado_por_ia": boolean,"id": string,"orden": number,"puesto_id": string | null,"tipo": Database["public"]['Enums']["tipo_modulo"],"titulo": string
                  }
                  Insert: {
                    "actualizado_en"?: string,"creado_en"?: string,"creado_por"?: string | null,"descripcion"?: string | null,"empresa_id": string,"estado"?: Database["public"]['Enums']["estado_contenido"],"generado_por_ia"?: boolean,"id"?: string,"orden"?: number,"puesto_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_modulo"],"titulo": string
                  }
                  Update: {
                    "actualizado_en"?: string,"creado_en"?: string,"creado_por"?: string | null,"descripcion"?: string | null,"empresa_id"?: string,"estado"?: Database["public"]['Enums']["estado_contenido"],"generado_por_ia"?: boolean,"id"?: string,"orden"?: number,"puesto_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_modulo"],"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "modulos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "modulos_puesto_id_fkey"
      columns: ["puesto_id"]
isOneToOne: false
      referencedRelation: "puestos"
      referencedColumns: ["id"]
    }
                  ]
                },"practicas": {
                  Row: {
                    "completada_en": string,"empresa_id": string,"escenario_id": string,"id": string,"modulo_id": string,"usuario_id": string
                  }
                  Insert: {
                    "completada_en"?: string,"empresa_id": string,"escenario_id": string,"id"?: string,"modulo_id": string,"usuario_id": string
                  }
                  Update: {
                    "completada_en"?: string,"empresa_id"?: string,"escenario_id"?: string,"id"?: string,"modulo_id"?: string,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "practicas_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "practicas_escenario_id_fkey"
      columns: ["escenario_id"]
isOneToOne: false
      referencedRelation: "escenarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "practicas_modulo_id_fkey"
      columns: ["modulo_id"]
isOneToOne: false
      referencedRelation: "modulos"
      referencedColumns: ["id"]
    }
                  ]
                },"preguntas": {
                  Row: {
                    "correcta": number,"empresa_id": string,"enunciado": string,"explicacion": string,"id": string,"modulo_id": string,"opciones": (string)[],"orden": number,"seccion": string
                  }
                  Insert: {
                    "correcta": number,"empresa_id": string,"enunciado": string,"explicacion": string,"id"?: string,"modulo_id": string,"opciones": (string)[],"orden": number,"seccion": string
                  }
                  Update: {
                    "correcta"?: number,"empresa_id"?: string,"enunciado"?: string,"explicacion"?: string,"id"?: string,"modulo_id"?: string,"opciones"?: (string)[],"orden"?: number,"seccion"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "preguntas_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "preguntas_modulo_id_fkey"
      columns: ["modulo_id"]
isOneToOne: false
      referencedRelation: "modulos"
      referencedColumns: ["id"]
    }
                  ]
                },"puestos": {
                  Row: {
                    "creado_en": string,"descripcion": string | null,"empresa_id": string,"id": string,"nombre": string
                  }
                  Insert: {
                    "creado_en"?: string,"descripcion"?: string | null,"empresa_id": string,"id"?: string,"nombre": string
                  }
                  Update: {
                    "creado_en"?: string,"descripcion"?: string | null,"empresa_id"?: string,"id"?: string,"nombre"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "puestos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"secciones": {
                  Row: {
                    "busqueda": unknown,"contexto": string | null,"documento_id": string,"embedding": string | null,"empresa_id": string,"id": string,"orden": number,"pagina": number | null,"referencia": string | null,"texto": string,"titulo": string
                  }
                  Insert: {
                    "busqueda"?: never,"contexto"?: string | null,"documento_id": string,"embedding"?: string | null,"empresa_id": string,"id"?: string,"orden": number,"pagina"?: number | null,"referencia"?: string | null,"texto": string,"titulo": string
                  }
                  Update: {
                    "busqueda"?: never,"contexto"?: string | null,"documento_id"?: string,"embedding"?: string | null,"empresa_id"?: string,"id"?: string,"orden"?: number,"pagina"?: number | null,"referencia"?: string | null,"texto"?: string,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "secciones_documento_id_fkey"
      columns: ["documento_id"]
isOneToOne: false
      referencedRelation: "documentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "secciones_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"sucursales": {
                  Row: {
                    "activa": boolean,"codigo_union": string,"creada_en": string,"empresa_id": string,"id": string,"nombre": string
                  }
                  Insert: {
                    "activa"?: boolean,"codigo_union"?: string,"creada_en"?: string,"empresa_id": string,"id"?: string,"nombre": string
                  }
                  Update: {
                    "activa"?: boolean,"codigo_union"?: string,"creada_en"?: string,"empresa_id"?: string,"id"?: string,"nombre"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sucursales_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "a_uuid":
{ Args: { "p": string }; Returns: string
                           },
"aceptar_invitaciones":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"atiendo":
{ Args: { "p_empresa": string,"p_sucursal": string }; Returns: boolean
                           },
"avance_por_sucursal":
{ Args: { "p_empresa": string }; Returns: {
              "listas": number,"personas": number,"sucursal": string
            }[]
                           },
"buscar_secciones":
{ Args: { "p_borradores"?: boolean,"p_consulta": string,"p_embedding"?: string,"p_empresa": string,"p_limite"?: number }; Returns: {
              "codigo": string,"documento": string,"fuente": string,"pagina": number,"puntaje": number,"referencia": string,"seccion_id": string,"texto": string,"titulo": string,"vias": string
            }[]
                           },
"crear_empresa":
{ Args: { "p_giro"?: string,"p_nombre": string,"p_puesto"?: string,"p_slug": string,"p_sucursal"?: string }; Returns: string
                           },
"dificultad_del_test":
{ Args: { "p_modulo": string }; Returns: {
              "aciertos": number,"enunciado": string,"pregunta_id": string,"respuestas": number
            }[]
                           },
"gestiono":
{ Args: { "p_empresa": string }; Returns: boolean
                           },
"huecos_del_material":
{ Args: { "p_dias"?: number,"p_empresa": string }; Returns: {
              "destino": Database["public"]['Enums']["destino_canalizacion"],"pregunta": string,"ultima": string,"veces": number
            }[]
                           },
"metricas_asistente":
{ Args: { "p_dias"?: number,"p_empresa": string }; Returns: {
              "canalizadas": number,"citas_invalidas": number,"con_cita": number,"consultas": number,"sin_resultados": number
            }[]
                           },
"mis_empresas":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"superviso":
{ Args: { "p_empresa": string }; Returns: boolean
                           },
"tengo_rol":
{ Args: { "p_empresa": string,"p_roles": (Database["public"]['Enums']["rol_miembro"])[] }; Returns: boolean
                           },
"unirse_con_codigo":
{ Args: { "p_codigo": string }; Returns: {
              "empresa_id": string,"slug": string
            }[]
                           }
          }
          Enums: {
            "destino_canalizacion": "supervisor"|"rh","estado_contenido": "borrador"|"autorizado"|"archivado","rol_miembro": "admin"|"rh"|"supervisor"|"colaborador","tipo_modulo": "induccion"|"refuerzo"
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
  "public": {
          Enums: {
            "destino_canalizacion": ["supervisor", "rh"],"estado_contenido": ["borrador", "autorizado", "archivado"],"rol_miembro": ["admin", "rh", "supervisor", "colaborador"],"tipo_modulo": ["induccion", "refuerzo"]
          }
        }
} as const

