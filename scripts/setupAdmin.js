import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tcvsemrmchhmhglbpjgv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdnNlbXJtY2hobWhnbGJwamd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzODU5NDYsImV4cCI6MjA1NDk2MTk0Nn0.yZfLAVotA-RssBepTwJSj90UinS_IP-8rh1UcsLiudU';

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin123!@#';

async function setupAdmin() {
    try {
        // 1. Najpierw utwórz konto w Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: {
                data: {
                    first_name: 'Admin',
                    last_name: 'User',
                    role: 'admin'
                }
            }
        });

        if (authError && !authError.message.includes('User already registered')) {
            console.error('Błąd tworzenia admina w Auth:', authError);
            throw authError;
        }

        console.log('Admin utworzony/zaktualizowany w Auth:', authData);

        // 2. Sprawdź czy admin już istnieje w tabeli users
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select()
            .eq('email', ADMIN_EMAIL)
            .single();

        if (existingUser) {
            console.log('Admin już istnieje w tabeli users:', existingUser);
            return;
        }

        // 3. Dodaj do tabeli users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([{
                id: authData?.user?.id, // Użyj ID z Auth
                email: ADMIN_EMAIL,
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin'
            }])
            .select()
            .single();

        if (userError) {
            console.error('Błąd dodawania admina do tabeli users:', userError);
            return;
        }

        console.log('Admin dodany do tabeli users:', userData);

        // 4. Spróbuj zalogować się jako admin
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (signInError) {
            console.error('Błąd logowania jako admin:', signInError);
            return;
        }

        console.log('Pomyślnie zalogowano jako admin:', signInData);
    } catch (error) {
        console.error('Błąd podczas tworzenia admina:', error);
    }
}

setupAdmin(); 