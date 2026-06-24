<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
   protected function schedule(Schedule $schedule)
{
   $schedule->command('reminder:kirim-oli')->dailyAt('08:00'); // ← ganti ini
}
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
    }
    // protected $middleware = [
    // \Illuminate\Http\Middleware\HandleCors::class, // ✅ pastikan ada ini
    // // ...

}