<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Sistem</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <style>
        body{
            background: #f5f5f5;
        }

        .login-card{
            width: 400px;
            border-radius: 15px;
        }
    </style>
</head>
<body>

<div class="container d-flex justify-content-center align-items-center vh-100">

    <div class="card shadow login-card">
        <div class="card-body p-4">

            <h2 class="text-center mb-4">
                Login Sistem
            </h2>

            @if(session('error'))
                <div class="alert alert-danger">
                    {{ session('error') }}
                </div>
            @endif

            <form action="/proses-login" method="POST">
                @csrf

                <div class="mb-3">
                    <label>Username</label>

                    <input type="email"
                           name="email"
                           class="form-control"
                           required>
                </div>

                <div class="mb-3">
                    <label>Password</label>

                    <input type="password"
                           name="password"
                           class="form-control"
                           required>
                </div>

                <button class="btn btn-primary w-100">
                    Login
                </button>

            </form>

        </div>
    </div>

</div>

</body>
</html>
