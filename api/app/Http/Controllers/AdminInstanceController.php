<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminInstanceController extends Controller
{
    /**
     * Liste toutes les instances (avec utilisateur + application), paginées.
     * Filtres : search (nom d'instance, hostname, email/username du propriétaire), status.
     */
    public function index(Request $request)
    {
        $q = DB::table('instances')
            ->leftJoin('users', 'users.id', '=', 'instances.user_id')
            ->leftJoin('applications', 'applications.id', '=', 'instances.app_id')
            ->select(
                'instances.*',
                'applications.name as app_name',
                'users.username as user_username',
                DB::raw("TRIM(CONCAT(COALESCE(users.first_name,''),' ',COALESCE(users.last_name,''))) as user_name"),
                'users.email as user_email',
            );

        if ($search = $request->string('search')->toString()) {
            $q->where(function ($w) use ($search) {
                $w->where('instances.instance_name', 'like', "%{$search}%")
                  ->orWhere('users.username', 'like', "%{$search}%")
                  ->orWhere('users.email', 'like', "%{$search}%")
                  ->orWhere('users.first_name', 'like', "%{$search}%")
                  ->orWhere('users.last_name', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->toString()) {
            $q->where('instances.status', $status);
        }

        return $q->orderByDesc('instances.created_at')->paginate(20);
    }
}
