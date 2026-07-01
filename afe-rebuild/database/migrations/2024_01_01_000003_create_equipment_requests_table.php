<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();

            // who submitted
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('requester_email');

            // request
            $table->enum('request_type', ['replacement', 'new_equipment']);
            $table->string('equipment_type');
            $table->string('reason')->nullable();
            $table->text('description')->nullable();

            // employee the equipment is for
            $table->string('employee_first_name');
            $table->string('employee_last_name');
            $table->string('employee_job_title')->nullable();
            $table->string('employee_email');
            $table->string('employee_phone')->nullable();
            $table->string('office');
            $table->string('business_unit');
            $table->string('cost_center')->nullable();
            $table->text('shipping_address')->nullable();
            $table->date('start_date')->nullable();

            // replacement / mobile extras
            $table->string('asset_tag')->nullable();
            $table->string('current_carrier')->nullable();
            $table->string('transfer_number')->nullable();
            $table->boolean('international_travel')->nullable();

            // routing + state
            $table->foreignId('submit_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('stage', [
                'submitted', 'bu_review', 'reviewer_review',
                'approved', 'ordered', 'shipped', 'received',
                'closed', 'denied', 'cancelled',
            ])->default('submitted');

            $table->timestamps();

            $table->index('stage');
            $table->index('request_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_requests');
    }
};
