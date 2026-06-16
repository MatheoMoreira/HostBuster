<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstanceController extends Controller
{
    public function index(Request $request)
    {
        return DB::table('instances')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'app_id' => ['required', 'integer', 'exists:applications,id'],
            'plan_name' => ['required', 'string', 'max:50'],
            'price' => ['required', 'integer', 'min:1'],
            'hostname' => ['required', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'cpu' => ['required', 'integer', 'min:1'],
            'ram' => ['required', 'integer', 'min:128'],
            'storage' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();

        if ((int) $user->credits < $data['price']) {
            return response()->json([
                'message' => 'Crédits insuffisants.',
                'required' => $data['price'],
                'available' => (int) $user->credits,
            ], 422);
        }

        $instance = DB::transaction(function () use ($user, $data) {
            $user->credits = (float) $user->credits - $data['price'];
            $user->save();

            $instanceId = DB::table('instances')->insertGetId([
                'user_id' => $user->id,
                'app_id' => $data['app_id'],
                'instance_name' => $data['hostname'],
                'cpu_allocated' => $data['cpu'],
                'ram_allocated' => $data['ram'],
                'storage_allocated' => $data['storage'],
                'status' => 'deploying',
                'created_at' => now(),
            ]);

            DB::table('orders')->insert([
                'user_id' => $user->id,
                'instance_id' => $instanceId,
                'amount' => $data['price'],
                'type' => 'purchase',
                'status' => 'completed',
                'created_at' => now(),
            ]);

            return DB::table('instances')->find($instanceId);
        });

        return response()->json([
            'instance' => $instance,
            'credits' => (int) $user->fresh()->credits,
        ], 201);
    }
}
