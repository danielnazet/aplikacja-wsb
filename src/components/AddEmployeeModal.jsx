const schema = z.object({
    email: z.string().email('Nieprawidłowy adres email'),
    firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
    lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
    role: z.enum(['admin', 'worker'], 'Wybierz rolę'),
    password: z.string()
        .min(8, 'Hasło musi mieć co najmniej 8 znaków')
        .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
        .regex(/[0-9]/, 'Hasło musi zawierać cyfrę')
}); 