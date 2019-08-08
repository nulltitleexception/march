$(function () {
    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        var pass1 = $('#pass1').val();
        var pass2 = $('#pass2').val();
        if (pass1 === pass2) {
            creds = {
                user: $('#user').val(),
                pass: pass1,
            };
            console.log('Creating user...');
            var socket = io();
            socket.emit('create_user', creds);
            socket.on('success', function (msg) {
                console.log('success! redirecting to /game');
                cacheCredentials(msg)
                window.location.href = '/game';
            });
            socket.on('fail', function (msg) {
                console.log('something went wrong');
                window.location.href = '/create';
            });
        } else {
            alert("Password fields do not match!");
        }
        return false;
    });
});