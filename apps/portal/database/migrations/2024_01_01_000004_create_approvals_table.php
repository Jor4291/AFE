<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_request_id')->constrained()->cascadeOnDelete();
            $table->enum('stage', ['bu_leader', 'reviewer', 'final', 'fulfilment']);
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('decision', ['pending', 'approved', 'denied'])->default('pending');
            $table->timestamp('decided_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['equipment_request_id', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
