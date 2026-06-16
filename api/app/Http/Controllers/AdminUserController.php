<?php

namespace App\Http\Controllers;

use App\Models\CreditAdjustment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $q = User::query();

        if ($search = $request->string('search')->toString()) {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
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

        $adjustments = CreditAdjustment::with('admin:id,name')
            ->where('user_id', $id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $instances = DB::table('instances')
            ->where('user_id', $id)
            ->orderByDesc('created_at')
            ->get();

        $totalSpent = DB::table('orders')
            ->where('user_id', $id)
            ->where('status', 'completed')
            ->sum('amount');

        return response()->json([
            'user' => $user,
            'adjustments' => $adjustments,
            'instances' => $instances,
            'total_spent' => (float) $totalSpent,
        ]);
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
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
