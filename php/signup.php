<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../phpmailer/src/Exception.php';
require __DIR__ . '/../phpmailer/src/PHPMailer.php';
require __DIR__ . '/../phpmailer/src/SMTP.php';

header('Content-Type: application/json');
session_start();

// Include database config
require_once 'config.php';

$action = $_POST['action'] ?? '';

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

function sendVerificationEmail($toEmail, $subject, $body)
{
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';  // or your SMTP host
        $mail->SMTPAuth   = true;
        $mail->Username   = 'm9034456@gmail.com'; // replace with your sender email
        $mail->Password   = 'wguz from cytn gzkg';    // use App Password if Gmail
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Recipients
        $mail->setFrom('m9034456@gmail.com', 'KargaCharge');
        $mail->addAddress($toEmail);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = nl2br($body);
        $mail->AltBody = strip_tags($body);

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}


function registerUser($conn){
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $usertype = $_POST['userType'] ?? '';
    $phoneno = $_POST['phoneno'] ?? '';

    if (!$name || !$email || !$password || !$usertype) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        return;
    }

    if($usertype === 'client'){
        $table = "ev_owner";
    } else {
        $table = "charging_provider";
    }

    $check = $conn->prepare("SELECT id from ? WHERE email = ?");
    $check -> bind_param("ss", $table, $email);
    $check -> execute();
    $check -> store_result();

    if ($check -> num_rows > 0){
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        return;
    }

    $check -> close();

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $verificationCode = rand(100000, 999999);

    $user_id = rand(1000000, 9999999);

    if($usertype === 'client'){
        $stmt = $conn -> prepare("INSERT INTO ev_owner(id, email, password_hash, phoneno, name, verification_code, is_verified)
                                    VALUES(?, ?, ?, ?, ?, ?)");
        $stmt -> bind_param("isssi",$user_id, $email, $password_hash, $phoneno, $name, $verificationCode, 0);
        $stmt -> execute();
        $stmt -> close();
    } else {
         $stmt = $conn -> prepare("INSERT INTO charging_provider(id, email, password_hash, phoneno, name, verification_code, is_verified)
                                    VALUES(?, ?, ?, ?, ?, ?)");
        $stmt -> bind_param("isssi",$user_id, $email, $password_hash, $phoneno, $name, $verificationCode, 0);
        $stmt -> bind_param("",);
        $stmt -> execute();
        $stmt -> close();
    }


    $subject = "Your Verification Code";
    $body = "Hello $name,<br><br>Your verification code is: <b>$verificationCode</b><br><br>Thank you for registering!";
    $emailSent = sendVerificationEmail($email, $subject, $body);


    echo json_encode([
        'success' => $emailSent,
        'message' => $emailSent
            ? 'User registered successfully. Verification code sent.'
            : 'User registered, but failed to send email.',
        'code' => $verificationCode // for testing only, remove later
    ]);
}

function verifyUser($conn){
    $email = $_POST['email'] ?? '';
    $code = $_POST['code'] ?? '';
    $usertype = $_POST['userType'] ?? '';

    if (!$code) {
    echo json_encode(['success' => false, 'message' => 'Verification code is required']);
    return;
    }

    if($usertype === 'client'){
        $table = "ev_owner";
    } else {
        $table = "charging_provider";
    }

    $stmt = $conn -> prepare("SELECT id FROM ? where email = ? && verification_code = ?");
    $stmt -> bind_param("ssi",$table ,$email, $code);
    $stmt -> execute();
    $result = $stmt -> get_result();
    $stmt -> close;

    if($result -> num_rows > 0){
        $update = $conn -> prepare("UPDATE ? SET is_verified = 1 WHERE email = ?");
        $update -> bind_param("ss", $table, $email);
        $update -> execute();
        $update -> close();

        echo json_encode(['success' => true, 'message' => 'Email verified successfully']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Invalid verification code']);
    }    
}

function resendCode($conn){
    $email = $_POST['email'] ?? '';
    $usertype = $_POST['userType'] ?? '';

    if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Email missing for resend']);
    return;
    }

    if($usertype === 'client'){
        $table = "ev_owner";
    } else {
        $table = "charging_provider";
    }
    
    $newCode = rand(100000, 999999);
    $stmt = $conn -> prepare("UPDATE ? SET verification_code = ? WHERE email = ?");
    $stmt -> bind_para("sis", $table, $newCode, $email);
    $stmt -> execute();
    
    if($stmt -> affected_rows > 0){

        $subject = "Your New Verification Code";
        $body = "Your new verification code is: <b>$newCode</b>";
        $emailSent = sendVerificationEmail($email, $subject, $body);


        echo json_encode([
            'success' => $emailSent,
            'message' => $emailSent
                ? 'Verification code resent.'
                : 'Failed to send email.'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to resend code']);
    }
    
    $stmt -> close();
}

?>