<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Encryption\Encrypter;
use InvalidArgumentException;
use RuntimeException;

/**
 * @implements CastsAttributes<array<string, mixed>, array<string, mixed>>
 */
class IntegrationCredentials implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (blank($value)) {
            return [];
        }

        return $this->encrypter()->decrypt($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if (blank($value)) {
            return null;
        }

        return $this->encrypter()->encrypt($value);
    }

    protected function encrypter(): Encrypter
    {
        $key = config('integrations.encryption_key');
        $cipher = config('integrations.cipher', 'AES-256-CBC');

        if (blank($key)) {
            throw new RuntimeException('INTEGRATIONS_ENCRYPTION_KEY no está configurada.');
        }

        if (str_starts_with($key, 'base64:')) {
            $key = base64_decode(substr($key, 7), true);

            if ($key === false) {
                throw new InvalidArgumentException('INTEGRATIONS_ENCRYPTION_KEY no contiene base64 válido.');
            }
        }

        return new Encrypter($key, $cipher);
    }
}
