<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MakeAdmin extends Command
{
    protected $signature = 'admin:make {email} {--name=Admin} {--password=}';

    protected $description = 'Promeut un utilisateur en admin (ou le crée si absent).';

    public function handle(): int
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if ($user) {
            $user->role = 'admin';
            $user->suspended_at = null;
            $user->save();
            $this->info("✓ {$email} est maintenant admin.");
            return self::SUCCESS;
        }

        $password = $this->option('password') ?: $this->secret('Mot de passe pour le nouvel admin');
        if (! $password || strlen($password) < 8) {
            $this->error('Mot de passe requis (8 caractères min).');
            return self::FAILURE;
        }

        // username unique dérivé de l'email
        $base = Str::slug(Str::before($email, '@'), '_') ?: 'admin';
        $username = $base;
        $i = 1;
        while (User::where('username', $username)->exists()) {
            $username = $base.($i++);
        }

        $user = User::create([
            'username' => $username,
            'first_name' => $this->option('name'),
            'last_name' => '',
            'email' => $email,
            'password' => Hash::make($password),
        ]);
        $user->role = 'admin';
        $user->save();

        $this->info("✓ Admin créé : {$email}");
        return self::SUCCESS;
    }
}
