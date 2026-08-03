<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Traçabilité de la suppression d'une instance :
     * - deleted_at : date/heure effective de la suppression.
     * - deleted_by : auteur de l'action (utilisateur). NULL = suppression
     *   automatique par le système (expiration d'abonnement).
     */
    public function up(): void
    {
        Schema::table('instances', function (Blueprint $table) {
            if (! Schema::hasColumn('instances', 'deleted_at')) {
                $table->dateTime('deleted_at')->nullable()->after('status');
            }
            if (! Schema::hasColumn('instances', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('deleted_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('instances', function (Blueprint $table) {
            $table->dropColumn(['deleted_at', 'deleted_by']);
        });
    }
};
