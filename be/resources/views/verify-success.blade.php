<!DOCTYPE html>
<html>
<head>
    <title>Verifikasi Berhasil</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial;
            background: #f4f6f9;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        h1 {
            color: #28a745;
        }
        p {
            margin: 10px 0 20px;
        }
        a {
            text-decoration: none;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
        }
    </style>
</head>
<body>

<div class="card">
    <h1>✅ Email Berhasil Diverifikasi</h1>
    <p>Akun kamu sudah aktif, silakan login.</p>

    <a href="{{ env('FRONTEND_URL') }}/login">
        Ke Halaman Login
    </a>
</div>

</body>
</html>