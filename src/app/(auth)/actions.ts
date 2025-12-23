'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email y contraseña son requeridos' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login error:', error.message);
        return { error: 'Credenciales inválidas' };
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Verificar si el usuario ya tiene una empresa asignada
    if (user) {
        const { data: empleado } = await supabase
            .from('empleados')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        revalidatePath('/', 'layout');

        if (!empleado) {
            // Usuario autenticado pero sin empresa, ir directo a onboarding
            redirect('/onboarding');
        }
    }

    redirect('/');
}

export async function signUp(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!email || !password || !confirmPassword) {
        return { error: 'Todos los campos son requeridos' };
    }

    if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden' };
    }

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // Crear el usuario usando la API de Admin para que esté verificado automáticamente
    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: email.split('@')[0], // Placeholder
        }
    });

    if (createError) {
        console.error('Admin CreateUser error:', createError.message);
        return { error: createError.message };
    }

    revalidatePath('/', 'layout');
    redirect('/login?registered=true');
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}

export async function cambiarPassword(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!currentPassword || !newPassword) {
        return { error: 'Ambas contraseñas son requeridas' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: 'Sesión no válida' };
    }

    // 1. Validar contraseña actual intentando hacer login de nuevo
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });

    if (authError) {
        return { error: 'La contraseña actual es incorrecta' };
    }

    // 2. Si es válida, actualizar a la nueva contraseña
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) {
        return { error: `Error al actualizar: ${updateError.message}` };
    }

    return { success: true };
}
