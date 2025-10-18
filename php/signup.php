<?php
header('Content-Type: application/json');
session_start();

// Include database config
require_once 'config.php';

$action = isset($_POST['action']) ? $_POST['action'] : '';

//here in the action value, the javscript sent are 'register', 'verify', 'resend'
//register - (name, email, password, userType). Gawa muna sya verification code then resend to the client
// then the client will verify that and the script will send the 'verify' action.

// verify - (email, code)

// pabasa nalang sa signup.js yung script tapos yung forms na isesend sa php, the same as the login.

?>