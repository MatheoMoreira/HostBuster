<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supprime la colonne `name` (héritée de Laravel) : redondante depuis
     * l'ajout de `first_name` / `last_name`. Le nom d'affichage complet est
     * désormais un attribut calculé (accessor `name` sur le modèle User).
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable()->after('last_name');
        });
    }
};
