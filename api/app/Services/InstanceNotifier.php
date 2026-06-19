<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Centralise les notifications liées au cycle de vie d'une instance :
 * email au client + entrée dans la table `notifications` (cloche in-app),
 * et alerte aux admins en cas d'échec.
 */
class InstanceNotifier
{
    /** Déploiement lancé. */
    public function deploying(object $instance, User $user): void
    {
        $this->send(
            $user, 'info',
            inApp: "Déploiement de « {$instance->instance_name} » lancé.",
            subject: "Déploiement lancé — {$instance->instance_name}",
            heading: 'Déploiement en cours',
            intro: "Bonjour {$user->first_name},\n\nVotre instance « {$instance->instance_name} » est en cours de création. Vous recevrez un email dès qu'elle sera en ligne (1 à 2 minutes).",
        );
    }

    /** Instance en ligne. */
    public function running(object $instance, User $user, ?string $url = null): void
    {
        $this->send(
            $user, 'info',
            inApp: "Instance « {$instance->instance_name} » en ligne".($url ? " : {$url}" : '').'.',
            subject: "Votre instance est en ligne — {$instance->instance_name}",
            heading: 'Votre instance est en ligne 🎉',
            intro: "Bonjour {$user->first_name},\n\nVotre instance « {$instance->instance_name} » est déployée et accessible.",
            accent: '#16a34a',
            url: $url,
            action: 'Ouvrir mon instance',
        );
    }

    /** Échec de déploiement : email client + alerte admins. */
    public function failed(object $instance, User $user, ?string $error = null): void
    {
        $this->send(
            $user, 'error',
            inApp: "Échec du déploiement de « {$instance->instance_name} ».",
            subject: "Échec du déploiement — {$instance->instance_name}",
            heading: 'Échec du déploiement',
            intro: "Bonjour {$user->first_name},\n\nLe déploiement de votre instance « {$instance->instance_name} » a échoué. Vos crédits restent disponibles. Vous pouvez réessayer depuis votre tableau de bord.",
        );

        // Alerte aux administrateurs.
        $admins = User::where('role', 'admin')->whereNotNull('email')->get();
        foreach ($admins as $admin) {
            $this->mail(
                $admin->email,
                "[ALERTE] Échec déploiement instance #{$instance->id}",
                'Alerte administrateur',
                "Échec du déploiement de l'instance #{$instance->id} « {$instance->instance_name} » (client : {$user->email}).\n\nDétail : ".($error ?: 'non communiqué'),
                accent: '#dc2626',
            );
        }
    }

    /** Abonnement expiré : instance arrêtée, début de la période de grâce. */
    public function expired(object $instance, User $user, string $deletionDate): void
    {
        $this->send(
            $user, 'alert',
            inApp: "Abonnement expiré : « {$instance->instance_name} » arrêtée. Renouvelez avant le {$deletionDate}.",
            subject: "Abonnement expiré — {$instance->instance_name}",
            heading: 'Votre instance a été suspendue',
            intro: "Bonjour {$user->first_name},\n\nL'abonnement de « {$instance->instance_name} » a expiré : l'instance est arrêtée. Renouvelez-le ({$instance->monthly_price} crédits) avant le {$deletionDate}, sinon l'instance et ses données seront définitivement supprimées.",
            accent: '#d97706',
            url: rtrim(config('app.frontend_url'), '/').'/instance/'.$instance->id,
            action: 'Renouveler mon instance',
        );
    }

    /** Rappel avant suppression (J-7 / J-1). */
    public function reminder(object $instance, User $user, int $daysLeft, string $deletionDate): void
    {
        $this->send(
            $user, 'alert',
            inApp: "Suppression de « {$instance->instance_name} » dans {$daysLeft} jour(s) si non renouvelée.",
            subject: "Rappel : suppression dans {$daysLeft} j — {$instance->instance_name}",
            heading: "Plus que {$daysLeft} jour(s)",
            intro: "Bonjour {$user->first_name},\n\nSans renouvellement, « {$instance->instance_name} » sera définitivement supprimée le {$deletionDate}. Renouvelez pour {$instance->monthly_price} crédits afin de la conserver.",
            accent: '#d97706',
            url: rtrim(config('app.frontend_url'), '/').'/instance/'.$instance->id,
            action: 'Renouveler maintenant',
        );
    }

    /** Suppression automatique (abonnement non renouvelé). */
    public function autoDeleted(object $instance, User $user): void
    {
        $this->send(
            $user, 'info',
            inApp: "Instance « {$instance->instance_name} » supprimée (abonnement non renouvelé).",
            subject: "Instance supprimée — {$instance->instance_name}",
            heading: 'Instance supprimée',
            intro: "Bonjour {$user->first_name},\n\nFaute de renouvellement, votre instance « {$instance->instance_name} » et ses données ont été définitivement supprimées.",
            accent: '#71717a',
        );
    }

    /** Instance supprimée. */
    public function deleted(object $instance, User $user): void
    {
        $this->send(
            $user, 'info',
            inApp: "Instance « {$instance->instance_name} » supprimée.",
            subject: "Instance supprimée — {$instance->instance_name}",
            heading: 'Instance supprimée',
            intro: "Bonjour {$user->first_name},\n\nVotre instance « {$instance->instance_name} » a bien été supprimée.",
            accent: '#71717a',
        );
    }

    /** Notification in-app + email client. */
    private function send(
        User $user, string $type, string $inApp, string $subject,
        string $heading, string $intro, ?string $accent = null,
        ?string $url = null, ?string $action = null,
    ): void {
        DB::table('notifications')->insert([
            'user_id' => $user->id,
            'type' => $type,
            'message' => $inApp,
            'sent_at' => now(),
        ]);

        if ($user->email) {
            $this->mail($user->email, $subject, $heading, $intro, $accent, $url, $action);
        }
    }

    /** Envoi email bas niveau (ne casse jamais le flux applicatif). */
    private function mail(
        string $to, string $subject, string $heading, string $intro,
        ?string $accent = null, ?string $url = null, ?string $action = null,
    ): void {
        try {
            $data = compact('subject', 'heading', 'intro');
            if ($accent) {
                $data['accent'] = $accent;
            }
            if ($url) {
                $data['url'] = $url;
                $data['action'] = $action ?? 'Ouvrir';
            }
            Mail::send('emails.notification', $data, function ($m) use ($to, $subject) {
                $m->to($to)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::warning('Échec envoi email notification', ['to' => $to, 'error' => $e->getMessage()]);
        }
    }
}
