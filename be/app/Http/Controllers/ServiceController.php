<?php

// namespace App\Http\Controllers;

// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\DB;
// use Kreait\Firebase\Factory;
// use Kreait\Firebase\Messaging\CloudMessage;
// use Kreait\Firebase\Messaging\Notification;

// class ServiceController extends Controller
// {

// public function motorTypes()
// {
//     $data = DB::table('motor_types')->get();

//     return response()->json($data);
// }


// public function saveToken(Request $request)
// {
//     DB::table('users')
//         ->where('id',$request->user_id)
//         ->update([
//             'fcm_token'=>$request->fcm_token
//         ]);

//     return response()->json([
//         "status"=>"success"
//     ]);
// }


// public function saveKm(Request $request)
// {

// $user_id = $request->user_id;
// $motor_id = $request->motor_type_id;
// $km = $request->km;


// DB::table('user_motors')->insert([
//     "user_id"=>$user_id,
//     "motor_type_id"=>$motor_id,
//     "last_km"=>$km
// ]);


// $motor = DB::table('motor_types')
//         ->where('id',$motor_id)
//         ->first();

// $serviceKm = $motor->service_km;

// $sisa = $serviceKm - $km;


// if($sisa <= 500){

//    $this->sendNotification($user_id);

// }

// return response()->json([
//     "status"=>"saved",
//     "sisa_service"=>$sisa
// ]);

// }


// private function sendNotification($user_id)
// {

// $user = DB::table('users')
//         ->where('id',$user_id)
//         ->first();

// $factory = (new Factory)
// ->withServiceAccount(storage_path('firebase.json'));

// $messaging = $factory->createMessaging();

// $message = CloudMessage::new()
//     ->withChangedTarget('token', $user->fcm_token)
//     ->withNotification(
//         Notification::create(
//             'Service Reminder',
//             'Motor kamu sudah mendekati waktu service'
//         )
//     );

// $messaging->send($message);

// }

// }