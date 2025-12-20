#!/usr/bin/env ts-node

/**
 * Script para crear el usuario administrador de la empresa
 *
 * Uso:
 *   npx ts-node scripts/create-admin-user.ts
 *
 * Variables de entorno requeridas:
 *   - SUPABASE_SERVICE_ROLE_KEY: La clave de service role de Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALTA');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'OK' : 'FALTA');
  process.exit(1);
}

// Cliente admin con service_role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    // 1. Obtener datos de la empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .limit(1)
      .single();

    if (empresaError) {
      throw new Error(`Error al obtener empresa: ${empresaError.message}`);
    }

    if (!empresa) {
      throw new Error('No se encontró ninguna empresa en la base de datos');
    }

    console.log(`\nEmpresa encontrada: ${empresa.nombre}`);
    console.log(`Email: ${empresa.email || 'No especificado'}`);

    // 2. Verificar si ya existe un usuario con ese email
    if (!empresa.email) {
      throw new Error('La empresa no tiene un email configurado');
    }

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users.find(u => u.email === empresa.email);

    if (userExists) {
      console.log('\n✓ Ya existe un usuario con este email');
      console.log(`  User ID: ${userExists.id}`);
      console.log(`  Email: ${userExists.email}`);
      console.log(`  Creado: ${new Date(userExists.created_at).toLocaleString('es-MX')}`);
      return;
    }

    // 3. Crear el usuario administrador
    const defaultPassword = 'TempPassword123!'; // El usuario deberá cambiarlo

    console.log('\nCreando usuario administrador...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: empresa.email,
      password: defaultPassword,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        nombre_completo: empresa.nombre,
        empresa_id: empresa.id,
        rol: 'admin',
      },
    });

    if (createError) {
      throw new Error(`Error al crear usuario: ${createError.message}`);
    }

    console.log('\n✓ Usuario creado exitosamente!');
    console.log(`  User ID: ${newUser.user?.id}`);
    console.log(`  Email: ${newUser.user?.email}`);
    console.log(`  Contraseña temporal: ${defaultPassword}`);
    console.log('\n⚠️  IMPORTANTE: El usuario debe cambiar esta contraseña en el primer inicio de sesión\n');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Error desconocido');
    process.exit(1);
  }
}

createAdminUser();
