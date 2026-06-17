<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\CoreApi;
use Midtrans\Transaction;

class QrisController extends Controller
{
    public function __construct()
    {
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized  = config('midtrans.is_sanitized');
        Config::$is3ds        = config('midtrans.is_3ds');
    }

    /**
     * Create a QRIS charge via Midtrans Core API.
     * Returns { qr_string, order_id, expiry_time }
     */
    public function createQris(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string',
            'amount'   => 'required|numeric|min:1',
        ]);

        $params = [
            'payment_type' => 'qris',
            'transaction_details' => [
                'order_id'     => $request->order_id,
                'gross_amount' => (int) $request->amount,
            ],
            'qris' => [
                'acquirer' => 'gopay',
            ],
        ];

        try {
            $response = CoreApi::charge($params);

            // Midtrans SDK returns stdClass objects, NOT arrays.
            // actions is an array of stdClass — iterate with object property access.
            $qrImageUrl = null;

            // 1) Try to get the generate-qr-code action URL (returns an image URL directly)
            if (!empty($response->actions) && is_array($response->actions)) {
                foreach ($response->actions as $action) {
                    if (isset($action->name) && $action->name === 'generate-qr-code') {
                        $qrImageUrl = $action->url ?? null;
                        break;
                    }
                }
            }

            // 2) Fallback: use qr_string (raw QR data) — wrap with QR generator API
            if (!$qrImageUrl && isset($response->qr_string)) {
                $encoded = urlencode($response->qr_string);
                $qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={$encoded}";
            }

            return response()->json([
                'success'      => true,
                'order_id'     => $response->order_id,
                'qr_string'    => $qrImageUrl,
                'expiry_time'  => $response->expiry_time ?? null,
                'status'       => $response->transaction_status ?? 'pending',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Check the status of a QRIS transaction.
     * Returns { status: 'settlement'|'pending'|'expire'|'cancel' }
     */
    public function checkStatus(Request $request, $orderId)
    {
        try {
            $status = Transaction::status($orderId);

            return response()->json([
                'success'            => true,
                'order_id'           => $status->order_id,
                'transaction_status' => $status->transaction_status,
                'fraud_status'       => $status->fraud_status ?? null,
                'gross_amount'       => $status->gross_amount ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
