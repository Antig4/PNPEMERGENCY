<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incident_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained()->onDelete('cascade');
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('old_status', 30)->nullable();
            $table->string('new_status', 30);
            $table->text('remarks')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('incident_id');
            $table->index('changed_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_status_histories');
    }
};
