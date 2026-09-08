<?php

namespace App\Models;

use App\Casts\IntegrationCredentials;
use Illuminate\Database\Eloquent\Model;

class Integration extends Model
{
    public const TELEGRAM = 'telegram';

    public const WHATSAPP = 'whatsapp';

    protected $guarded = [];

    protected $hidden = ['credentials'];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'credentials' => IntegrationCredentials::class,
            'settings' => 'array',
        ];
    }

    public static function service(string $service): ?self
    {
        return static::query()->firstWhere('service', $service);
    }

    public function credential(string $key): mixed
    {
        return data_get($this->credentials, $key);
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        return data_get($this->settings, $key, $default);
    }
}
