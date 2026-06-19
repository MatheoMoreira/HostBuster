<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Modèle d'abonnement mensuel :
     * - paid_until : fin de la période payée en cours.
     * - monthly_price : prix (crédits) à payer pour renouveler 30 jours.
     * - last_reminder : dernier rappel envoyé pendant la grâce (expired|7d|1d).
     * scheduled_deletion_at (déjà présent) = date de suppression définitive.
     */
    public function up(): void
    {
        Schema::table('instances', function (Blueprint $table) {
            if (! Schema::hasColumn('instances', 'paid_until')) {
                $table->dateTime('paid_until')->nullable()->after('status');
            }
            if (! Schema::hasColumn('instances', 'monthly_price')) {
                $table->integer('monthly_price')->nullable()->after('paid_until');
            }
            if (! Schema::hasColumn('instances', 'last_reminder')) {
                $table->string('last_reminder', 10)->nullable()->after('scheduled_deletion_at');
            }
        });

        // Backfill des instances existantes (non supprimées) :
        // période payée = création + 30 jours, prix = montant de la commande d'achat.
        foreach (DB::table('instances')->where('status', '!=', 'deleted')->get() as $inst) {
            $price = DB::table('orders')
                ->where('instance_id', $inst->id)
                ->where('type', 'purchase')
                ->value('amount');

            DB::table('instances')->where('id', $inst->id)->update([
                'paid_until' => \Illuminate\Support\Carbon::parse($inst->created_at)->addDays(30),
                'monthly_price' => $price ? (int) round($price) : null,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('instances', function (Blueprint $table) {
            $table->dropColumn(['paid_until', 'monthly_price', 'last_reminder']);
        });
    }
};
