<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CreditController extends Controller
{
    /**
     * Recharge crédits.
     * Pour ce projet fictif : Stripe est validé côté front,
     * on crédite directement le compte et on enregistre l'order.
     */
    public function recharge(Request $request)
    {
        $data = $request->validate([
            'credits' => ['required', 'integer', 'min:100', 'max:1000000'],
        ]);

        $user = $request->user();
        $euros = $data['credits'] / 100;

        DB::transaction(function () use ($user, $data, $euros) {
            $user->credits = (float) $user->credits + $data['credits'];
            $user->save();

            DB::table('orders')->insert([
                'user_id' => $user->id,
                'instance_id' => null,
                'amount' => $euros,
                'type' => 'purchase',
                'status' => 'completed',
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'credits' => (int) $user->fresh()->credits,
            'added' => $data['credits'],
        ]);
    }
}
