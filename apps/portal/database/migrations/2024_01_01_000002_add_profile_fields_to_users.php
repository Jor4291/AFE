<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // email + password remain the baseline login (Laravel default columns).
            // password is made nullable so SSO-only accounts can exist without one.
            $table->string('password')->nullable()->change();

            $table->string('username')->nullable()->unique()->after('name'); // optional display/legacy handle
            $table->string('job_title')->nullable()->after('email');
            $table->string('office')->nullable()->after('job_title');
            $table->string('business_unit')->nullable()->after('office');
            $table->string('phone')->nullable()->after('business_unit');
            $table->boolean('active')->default(true)->after('phone');

            // optional Microsoft 365 SSO linkage (null for email/password-only users)
            $table->string('oauth_provider')->nullable()->after('active'); // e.g. 'azure'
            $table->string('oauth_id')->nullable()->after('oauth_provider');
            $table->index(['oauth_provider', 'oauth_id']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'job_title', 'office', 'business_unit', 'phone', 'active', 'oauth_provider', 'oauth_id']);
        });
    }
};
