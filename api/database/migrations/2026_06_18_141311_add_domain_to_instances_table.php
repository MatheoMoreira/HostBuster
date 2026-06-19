<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * URL/domaine public de l'instance, renvoyé par le worker au callback.
     */
    public function up(): void
    {
        Schema::table('instances', function (Blueprint $table) {
            if (! Schema::hasColumn('instances', 'domain')) {
                $table->string('domain', 255)->nullable()->after('ipv6_address');
            }
        });
    }

    public function down(): void
    {
        Schema::table('instances', function (Blueprint $table) {
            $table->dropColumn('domain');
        });
    }
};
