<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class WhatsappController extends Controller
{
    private $gatewayUrl = 'http://localhost:8082';

    /**
     * Get connection status.
     */
    public function status()
    {
        try {
            $response = Http::timeout(3)->get("{$this->gatewayUrl}/api/whatsapp/status");
            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Exception $e) {
            // Silence exception to return standard offline response
        }

        return response()->json([
            'success' => false,
            'status' => 'DISCONNECTED',
            'number' => '',
            'message' => 'WhatsApp Gateway Node.js tidak aktif.'
        ]);
    }

    /**
     * Get QR Code.
     */
    public function qr()
    {
        try {
            $response = Http::timeout(3)->get("{$this->gatewayUrl}/api/whatsapp/qr");
            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Exception $e) {
            // Silence exception
        }

        return response()->json([
            'success' => false,
            'qr' => null,
            'message' => 'WhatsApp Gateway Node.js tidak aktif.'
        ]);
    }

    /**
     * Disconnect WhatsApp.
     */
    public function disconnect()
    {
        try {
            $response = Http::timeout(5)->post("{$this->gatewayUrl}/api/whatsapp/disconnect");
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungkan ke WhatsApp Gateway Node.js.'
            ], 500);
        }
    }

    /**
     * Send Broadcast.
     */
    public function broadcast(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'numbers' => 'required|array|min:1',
            'template' => 'nullable|string',
            'target' => 'nullable|string'
        ]);

        try {
            $response = Http::timeout(10)->post("{$this->gatewayUrl}/api/whatsapp/broadcast", [
                'message' => $request->message,
                'numbers' => $request->numbers
            ]);
            
            $resData = $response->json();
            if ($response->successful() && isset($resData['success']) && $resData['success']) {
                // Save log to sqlite database
                DB::table('riwayat_broadcasts')->insert([
                    'template' => $request->template ?? 'Custom Message',
                    'target' => $request->target ?? (count($request->numbers) . ' kontak'),
                    'pesan' => $request->message,
                    'tanggal' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            return response()->json($resData, $response->status());
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim broadcast. WhatsApp Gateway Node.js tidak merespons.'
            ], 500);
        }
    }

    /**
     * Get broadcast history from database.
     */
    public function history()
    {
        $history = DB::table('riwayat_broadcasts')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                // Format tanggal to Indonesian readable text
                $dateObj = new \DateTime($item->tanggal);
                return [
                    'id' => $item->id,
                    'template' => $item->template,
                    'target' => $item->target,
                    'pesan' => $item->pesan,
                    'time' => $dateObj->format('d/m/Y H:i')
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }
}
