<!DOCTYPE html>
<html>
<head>
    <title>Username Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f2f5;
        }
        .container {
            background: white;
            padding: 30px 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        input[type="text"] {
            padding: 8px 12px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-right: 10px;
        }
        
        #submitBtn {
            background-color: green;
            color: white;
            padding: 8px 20px;
            font-size: 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #message {
            margin-top: 20px;
            font-size: 16px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div>
        <h2>Username Verification</h2>
        <input type="text" id="username" placeholder="Enter username" />
        <button id="submitBtn">Submit</button>
        <div id="message"></div>
    </div>

    
</body>
</html>