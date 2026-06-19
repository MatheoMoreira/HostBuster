<?php

namespace App\Http\Controllers;

use App\Models\CreditAdjustment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $q = User::query();

        if ($search = $request->string('search')->toString()) {
            $q->where(function ($w) use ($search) {
                $w->where('username', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->string('role')->toString()) {
            $q->where('role', $role);
        }

        return $q->orderByDesc('created_at')->paginate(20);
    }

    public function show(int $id)
    {
        $user = User::withCount('tokens')->findOrFail($id);

        $instances = DB::table('instances')
            ->where('user_id', $id)
            ->orderByDesc('created_at')
            ->get();

        $totalSpent = DB::table('orders')
            ->where('user_id', $id)
            ->where('status', 'completed')
            ->whereNull('instance_id')
            ->sum('amount');

        return response()->json([
            'user' => $user,
            'credit_history' => $this->buildCreditHistory($id),
            'instances' => $instances,
            'total_spent' => (float) $totalSpent,
        ]);
    }

    private function buildCreditHistory(int $userId): array
    {
        // Laravel écrit les timestamps avec now() (fuseau APP_TIMEZONE), MySQL les
        // stocke tels quels en string. On les relit donc en interprétant l'heure
        // dans le fuseau de l'app, puis on convertit en UTC pour le front.
        $appTz = config('app.timezone');
        $toUtcIso = fn ($value) => Carbon::parse((string) $value, $appTz)
            ->utc()
            ->toIso8601String();

        $adjustments = CreditAdjustment::with('admin:id,first_name,last_name')
            ->where('user_id', $userId)
            ->get()
            ->map(fn ($a) => [
                'kind' => 'admin_adjustment',
                'amount' => (float) $a->amount,
                'reason' => $a->reason,
                'admin_name' => $a->admin?->name,
                'created_at' => $toUtcIso($a->created_at),
            ]);

        $orders = DB::table('orders')
            ->leftJoin('instances', 'orders.instance_id', '=', 'instances.id')
            ->where('orders.user_id', $userId)
            ->where('orders.status', 'completed')
            ->select(
                'orders.id',
                'orders.instance_id',
                'orders.amount',
                'orders.type',
                'orders.created_at',
                'instances.instance_name',
            )
            ->get()
            ->map(function ($o) use ($toUtcIso) {
                $createdAt = $toUtcIso($o->created_at);

                // orders.amount = € pour une recharge (instance_id NULL), crédits pour un achat d'instance
                if ($o->instance_id === null) {
                    return [
                        'kind' => 'credit_purchase',
                        'amount' => (float) $o->amount * 100,
                        'euros' => (float) $o->amount,
                        'created_at' => $createdAt,
                    ];
                }

                return [
                    'kind' => 'instance_purchase',
                    'amount' => -1 * (float) $o->amount,
                    'instance_id' => (int) $o->instance_id,
                    'instance_name' => $o->instance_name,
                    'created_at' => $createdAt,
                ];
            });

        return $adjustments
            ->concat($orders)
            ->sortByDesc(fn ($e) => strtotime($e['created_at']))
            ->values()
            ->take(100)
            ->all();
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', 'max:150', "unique:users,email,{$id}"],
            'role' => ['sometimes', 'in:admin,client'],
        ]);

        // Sécurité : un admin ne peut pas se rétrograder lui-même
        if (isset($data['role']) && $request->user()->id === $user->id && $data['role'] !== 'admin') {
            return response()->json(['message' => 'Vous ne pouvez pas modifier votre propre rôle.'], 422);
        }

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function adjustCredits(Request $request, int $id)
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'not_in:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::findOrFail($id);

        DB::transaction(function () use ($user, $data, $request) {
            $user->credits = (float) $user->credits + (float) $data['amount'];
            if ($user->credits < 0) {
                $user->credits = 0;
            }
            $user->save();

            CreditAdjustment::create([
                'user_id' => $user->id,
                'admin_id' => $request->user()->id,
                'amount' => $data['amount'],
                'reason' => $data['reason'] ?? null,
            ]);
        });

        return response()->json($user->fresh());
    }

    public function suspend(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas vous suspendre vous-même.'], 422);
        }

        $user->suspended_at = now();
        $user->save();
        $user->tokens()->delete();

        return response()->json($user->fresh());
    }

    public function unsuspend(int $id)
    {
        $user = User::findOrFail($id);
        $user->suspended_at = null;
        $user->save();

        return response()->json($user->fresh());
    }

    public function destroy(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}
