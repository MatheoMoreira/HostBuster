<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

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

        $user = User::create([
            'name' => $this->option('name'),
            'email' => $email,
            'password' => Hash::make($password),
        ]);
        $user->role = 'admin';
        $user->save();

        $this->info("✓ Admin créé : {$email}");
        return self::SUCCESS;
    }
}
