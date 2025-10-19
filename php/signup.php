<?php
header('Content-Type: application/json');
session_start();

// Include database config
require_once 'config.php';

$action = $_POST['action'] ?? '';

//here in the action value, the javscript sent are 'register', 'verify', 'resend'
//register - (name, email, password, userType). Gawa muna sya verification code then resend to the client
// then the client will verify that and the script will send the 'verify' action.

switch($action){
    case 'register':
        registerUser($conn);
        break;
    
    case 'verify':
        verifyUser($conn);
        break;

    case 'resend';
        resendCode($conn);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

$conn->close();

// verify - (email, code)

// pabasa nalang sa signup.js yung script tapos yung forms na isesend sa php, the same as the login.

function registerUser($conn){
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $usertype = $_POST['userType'] ?? '';

    if (!$name || !$email || !$password || !$userType) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        return;
    }

    $check = $conn->prepare("SELECT id from users WHERE email = ?");
    $check -> bind_param("s", $email);
    $check -> execute();
    $check -> store_result();

    if ($check -> num_rows > 0){
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        return;
    }

    $check -> close();

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $verificationCode = rand(100000, 999999);

    //TODO: Finalize ERD to insert new user
    $stmt = $conn -> prepare("INSERT INTO users() 
                                VALUES()");
    $stmt -> bind_param("",);
    $stmt -> execute();
    $stmt -> close();

    //TODO: Install PHPMailer to mail verification code
    //Here: mail code to email using PHPMailer


    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully. Verification code sent.',
        'code' => $verificationCode // (for testing)
    ]);
}

function verifyUser($conn){
    $email = $_POST['email'] ?? '';
    $code = $_POST['code'] ?? '';

    if (!$code) {
    echo json_encode(['success' => false, 'message' => 'Verification code is required']);
    return;
    }

    $stmt = $conn -> prepare("SELECT id FROM users where id = ? && verification_code = ?");
    $stmt -> bind_param("si",$email, $code);
    $stmt -> execute();
    $result = $stmt -> get_result();
    $stmt -> close;

    if($result -> num_rows > 0){
        $update = $conn -> prepare("UPDATE users SET is_verified = 1 WHERE email = ?");
        $update -> bind_param("s", $email);
        $update -> execute();
        $update -> close();

        echo json_encode(['success' => true, 'message' => 'Email verified successfully']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Invalid verification code']);
    }    
}

function resendCode($conn){
    $email = $_POST['email'] ?? '';

    if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Email missing for resend']);
    return;
    }
    
    $newCode = rand(100000, 999999);
    $stmt = $conn -> prepare("UPDATE users SET verification_code = ? WHERE email = ?");
    $stmt -> bind_para("is", $newCode, $email);
    $stmt -> execute();
    
    if($stmt -> affected_rows > 0){
        //Here: Email the code
        echo json_encode(['success' => true, 'message' => 'Verification code resent']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to resend code']);
    }
    
    $stmt -> close();
}

?>