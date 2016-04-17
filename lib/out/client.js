var io;
$(function () {
    function joinServer(id) {
        var socket = io('/{{name}}/' + id);
        var socketEnds = false;
        socket.on("stdout", function (data) {
            console.log('stdout' + data);
            $("#term").append(data.replace(/\n/g, '<br/>'));
            $('#term').scrollTop($('#term')[0].scrollHeight);
        });
        socket.on("stderr", function (data) {
            console.log('stderr' + data);
            $("#term").append("<span class=\"error\">" + data.replace(/\n/g, '<br/>') + "</span>");
            $('#term').scrollTop($('#term')[0].scrollHeight);
        });
        socket.on("exit", function (data) {
            socketEnds = true;
            var exit = JSON.parse(data);
            $("#term").append("<span class=\"exit\">Process exit with " + exit.code + ".</span>");
        });
        $("#input").submit(function (event) {
            if (!socketEnds) {
                socket.emit('stdin', $('#m').val());
            }
            $('#m').val('');
            return false;
        });
        $("#m").removeAttr('disabled');
    }
    $.post('/{{name}}/create', {
        a: 'a',
        b: 'b',
    })
        .done(function (data) {
        joinServer(data);
    })
        .fail(function () {
        alert('Server error');
        console.log("failed");
    });
});
