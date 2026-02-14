<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\VespaPedia;
use Illuminate\Support\Facades\Storage;

echo "Starting image rename process...\n\n";

$pedias = VespaPedia::whereNotNull('gambar')->get();
$count = 0;

foreach ($pedias as $pedia) {
    $oldFilename = $pedia->gambar;
    
    // Cek jika ada spasi atau karakter aneh
    if (strpos($oldFilename, ' ') !== false) {
        $newFilename = str_replace(' ', '_', $oldFilename);
        
        $oldPath = 'vespa-pedia/' . $oldFilename;
        $newPath = 'vespa-pedia/' . $newFilename;
        
        // Rename file jika exist
        if (Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->move($oldPath, $newPath);
            
            // Update database
            $pedia->gambar = $newFilename;
            $pedia->save();
            
            echo "✅ ID {$pedia->id}: {$oldFilename} -> {$newFilename}\n";
            $count++;
        } else {
            echo "⚠️  ID {$pedia->id}: File not found - {$oldPath}\n";
        }
    }
}

echo "\n✨ Done! {$count} files renamed.\n";