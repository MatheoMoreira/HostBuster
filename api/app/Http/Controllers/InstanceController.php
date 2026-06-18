<?php

namespace App\Http\Controllers;

use App\Services\Worker\CreateInstanceRequest;
use App\Services\Worker\UpdateInstanceRequest;
use App\Services\Worker\WorkerClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class InstanceController extends Controller
{
    public function __construct(private readonly WorkerClient $worker) {}

    public function index(Request $request)
    {
        return DB::table('instances')
            ->leftJoin('applications', 'applications.id', '=', 'instances.app_id')
            ->where('instances.user_id', $request->user()->id)
            ->orderByDesc('instances.created_at')
            ->select('instances.*', 'applications.name as app_name')
            ->get();
    }

    public function store(Request $request)
    {
        if ($request->user()->email_verified_at === null) {
            return response()->json([
                'message' => 'Veuillez vérifier votre adresse email avant de déployer une instance.',
                'code' => 'email_unverified',
            ], 403);
        }

        $data = $request->validate([
            'app_id' => ['required', 'integer', 'exists:applications,id'],
            'plan_name' => ['required', 'string', 'max:50'],
            'price' => ['required', 'integer', 'min:1'],
            'hostname' => ['required', 'string', 'max:100'],
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

        $appType = $this->resolveAppType((int) $data['app_id']);

        $this->worker->createInstance(new CreateInstanceRequest(
            instanceId: (int) $instance->id,
            appType: $appType,
            hostname: $data['hostname'],
            cpu: (int) $data['cpu'],
            ram: (int) $data['ram'],
            storage: (int) $data['storage'],
            callbackUrl: URL::to('/api/worker/callback'),
        ));

        return response()->json([
            'instance' => $instance,
            'credits' => (int) $user->fresh()->credits,
        ], 201);
    }

    public function show(Request $request, int $id)
    {
        $instance = DB::table('instances')
            ->leftJoin('applications', 'applications.id', '=', 'instances.app_id')
            ->where('instances.id', $id)
            ->where('instances.user_id', $request->user()->id)
            ->select('instances.*', 'applications.name as app_name')
            ->first();

        abort_if(! $instance, 404);

        return response()->json($instance);
    }

    public function update(Request $request, int $id)
    {
        $instance = DB::table('instances')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        abort_if(! $instance, 404);

        $data = $request->validate([
            'cpu' => ['nullable', 'integer', 'min:1'],
            'ram' => ['nullable', 'integer', 'min:128'],
            'storage' => ['nullable', 'integer', 'min:1'],
        ]);

        $state = $this->worker->updateInstance($id, new UpdateInstanceRequest(
            cpu: $data['cpu'] ?? null,
            ram: $data['ram'] ?? null,
            storage: $data['storage'] ?? null,
        ));

        return response()->json([
            'instance' => DB::table('instances')->find($id),
            'status' => $state->status,
        ]);
    }

    public function start(Request $request, int $id)
    {
        $this->ensureOwner($request, $id);
        $state = $this->worker->startInstance($id);

        return response()->json(['status' => $state->status]);
    }

    public function stop(Request $request, int $id)
    {
        $this->ensureOwner($request, $id);
        $state = $this->worker->stopInstance($id);

        return response()->json(['status' => $state->status]);
    }

    private function ensureOwner(Request $request, int $id): void
    {
        $exists = DB::table('instances')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->exists();
        abort_if(! $exists, 404);
    }

    public function destroy(Request $request, int $id)
    {
        $instance = DB::table('instances')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        abort_if(! $instance, 404);

        $this->worker->deleteInstance($id);

        return response()->noContent();
    }

    private function resolveAppType(int $appId): string
    {
        $name = (string) DB::table('applications')->where('id', $appId)->value('name');

        return match (true) {
            str_contains(strtolower($name), 'wordpress') => 'wordpress',
            str_contains(strtolower($name), 'minecraft') => 'minecraft',
            str_contains(strtolower($name), 'odoo') => 'odoo',
            str_contains(strtolower($name), 'glpi') => 'glpi',
            default => 'unknown',
        };
    }
}
