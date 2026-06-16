<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditAdjustment extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'admin_id', 'amount', 'reason'];

    protected $casts = [
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    protected $attributes = [
        // created_at géré par DEFAULT CURRENT_TIMESTAMP côté MySQL
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
