<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Ajoute un identifiant `username` (unique, sert aussi à la connexion),
     * ainsi que `first_name` (prénom) et `last_name` (nom).
     * Le champ `name` historique est conservé comme nom d'affichage complet.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username', 50)->nullable()->after('id');
            }
            if (! Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name', 100)->nullable()->after('username');
            }
            if (! Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 100)->nullable()->after('first_name');
            }
        });

        // Backfill des comptes existants à partir du champ `name` et de l'email.
        $taken = [];
        foreach (DB::table('users')->get() as $u) {
            // Prénom / Nom : on coupe `name` au premier espace.
            $parts = preg_split('/\s+/', trim((string) $u->name), 2);
            $first = $parts[0] ?? '';
            $last = $parts[1] ?? '';

            // Username : base = partie locale de l'email, slugifiée, unique.
            $base = Str::slug(Str::before((string) $u->email, '@'), '_') ?: 'user';
            $username = $base;
            $i = 1;
            while (in_array($username, $taken, true)
                || DB::table('users')->where('username', $username)->where('id', '!=', $u->id)->exists()) {
                $username = $base.($i++);
            }
            $taken[] = $username;

            DB::table('users')->where('id', $u->id)->update([
                'username' => $username,
                'first_name' => $first,
                'last_name' => $last,
            ]);
        }

        // Une fois rempli, on impose l'unicité du username.
        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_username_unique');
            $table->dropColumn(['username', 'first_name', 'last_name']);
        });
    }
};
