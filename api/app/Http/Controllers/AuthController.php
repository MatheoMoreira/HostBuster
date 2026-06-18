<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Inscription d'un nouveau client.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9_.-]+$/', 'unique:users,username'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ], [
            'username.regex' => 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores.',
        ]);

        $user = User::create([
            'username' => $data['username'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'name' => trim($data['first_name'].' '.$data['last_name']),
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        // Jeton de vérification (hors fillable, donc affecté explicitement).
        $user->email_verified_at = null;
        $user->email_verification_token = Str::random(64);
        $user->save();

        // Recharge depuis la BDD pour récupérer les valeurs par défaut (credits, role)
        $user->refresh();

        $this->sendVerificationLink($user);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Connexion : renvoie un token Sanctum.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            // `login` accepte aussi bien un email qu'un nom d'utilisateur.
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $field = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($field, $credentials['login'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Identifiants incorrects.'],
            ]);
        }

        if ($user->suspended_at !== null) {
            throw ValidationException::withMessages([
                'login' => ['Compte suspendu. Contactez un administrateur.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Déconnexion : révoque le token courant.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    /**
     * Utilisateur authentifié.
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Mise à jour de son propre profil (nom, email, mot de passe).
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'username' => ['sometimes', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9_.-]+$/', "unique:users,username,{$user->id}"],
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', 'max:150', "unique:users,email,{$user->id}"],
            // Changement de mot de passe : nécessite le mot de passe actuel.
            'current_password' => ['required_with:password', 'string'],
            'password' => ['sometimes', 'confirmed', Password::min(8)->letters()->numbers()],
        ], [
            'username.regex' => 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores.',
        ]);

        if (! empty($data['password'])) {
            if (! Hash::check($data['current_password'] ?? '', $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Le mot de passe actuel est incorrect.'],
                ]);
            }
            $user->password = $data['password'];
        }

        if (isset($data['username'])) {
            $user->username = $data['username'];
        }
        if (isset($data['first_name'])) {
            $user->first_name = $data['first_name'];
        }
        if (isset($data['last_name'])) {
            $user->last_name = $data['last_name'];
        }
        if (isset($data['email'])) {
            $user->email = $data['email'];
        }

        // `name` reste synchronisé comme nom d'affichage complet.
        if (isset($data['first_name']) || isset($data['last_name'])) {
            $user->name = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));
        }

        $user->save();

        return response()->json($user->fresh());
    }

    /**
     * Vérifie l'email via le jeton du lien. Redirige vers le front.
     */
    public function verifyEmail(Request $request)
    {
        $token = (string) $request->query('token');
        $front = rtrim(config('app.frontend_url'), '/');

        $user = $token ? User::where('email_verification_token', $token)->first() : null;

        if (! $user) {
            return redirect()->away($front.'/?verified=invalid');
        }

        if ($user->email_verified_at === null) {
            $user->email_verified_at = now();
            $user->email_verification_token = null;
            $user->save();
        }

        return redirect()->away($front.'/?verified=1');
    }

    /**
     * Renvoie un nouveau lien de vérification à l'utilisateur connecté.
     */
    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified_at !== null) {
            return response()->json(['message' => 'Adresse déjà vérifiée.'], 422);
        }

        $user->email_verification_token = Str::random(64);
        $user->save();

        $this->sendVerificationLink($user);

        return response()->json(['message' => 'Un nouveau lien de vérification a été envoyé.']);
    }

    /**
     * Demande de réinitialisation : envoie un lien si l'email existe.
     * Réponse générique pour ne pas révéler l'existence d'un compte.
     */
    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $data['email'])->first();

        if ($user) {
            $token = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make($token), 'created_at' => now()],
            );

            $front = rtrim(config('app.frontend_url'), '/');
            $url = $front.'/reset-password?token='.$token.'&email='.urlencode($user->email);

            Mail::send('emails.action', [
                'title' => 'Réinitialisation du mot de passe',
                'heading' => 'Mot de passe oublié ?',
                'intro' => "Bonjour {$user->first_name}, cliquez ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 60 minutes.",
                'action' => 'Réinitialiser mon mot de passe',
                'url' => $url,
                'footer' => "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email : votre mot de passe reste inchangé.",
            ], function ($m) use ($user) {
                $m->to($user->email, $user->name)->subject('Réinitialisation de votre mot de passe — HostBuster');
            });
        }

        return response()->json([
            'message' => 'Si un compte existe avec cet email, un lien de réinitialisation vient d\'être envoyé.',
        ]);
    }

    /**
     * Applique le nouveau mot de passe à partir du jeton reçu par email.
     */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $row = DB::table('password_reset_tokens')->where('email', $data['email'])->first();

        if (! $row || ! Hash::check($data['token'], $row->token)) {
            throw ValidationException::withMessages(['token' => ['Lien invalide.']]);
        }

        if (Carbon::parse($row->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
            throw ValidationException::withMessages(['token' => ['Lien expiré, veuillez en redemander un.']]);
        }

        $user = User::where('email', $data['email'])->firstOrFail();
        $user->password = $data['password'];
        $user->save();

        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
        // Révoque les sessions/tokens existants par sécurité.
        $user->tokens()->delete();

        return response()->json(['message' => 'Mot de passe réinitialisé. Vous pouvez vous connecter.']);
    }

    /**
     * Envoie l'email contenant le lien de vérification.
     */
    private function sendVerificationLink(User $user): void
    {
        $url = rtrim(config('app.url'), '/').'/api/verify-email?token='.$user->email_verification_token;

        Mail::send('emails.action', [
            'title' => 'Vérifiez votre adresse email',
            'heading' => 'Bienvenue sur HostBuster !',
            'intro' => "Bonjour {$user->first_name}, confirmez votre adresse email pour débloquer le déploiement d'instances et le rechargement de crédits.",
            'action' => 'Vérifier mon email',
            'url' => $url,
            'footer' => "Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.",
        ], function ($m) use ($user) {
            $m->to($user->email, $user->name)->subject('Vérifiez votre adresse email — HostBuster');
        });
    }
}
