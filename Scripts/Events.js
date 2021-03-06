﻿$(function ()
{
    setScreen(false);

    //Declare a proxy to reference the hub.
    var chatHub = $.connection.chatHub;

    registerClientMethods(chatHub);

    // Start hub
    $.connection.hub.start().done(function ()
    {
        registerEvents(chatHub)
    });
});

function setScreen(isLogin)
{
    if (isLogin)
    {
        $("#divChat").show();
        $("#divLogin").hide();
    } else
    {
        $("#divChat").hide();
        $("#divLogin").show();
    }
}

function registerEvents(chatHub)
{
    $("#btnStartChat").click(function ()
    {
        var name = $("#txtNickName").val();
        if (name.length > 0)
        {
            chatHub.server.connect(name);
        } else
        {
            alert("Enter a name");
        }
    });

    $("#btnSendMsg").click(function ()
    {
        var msg = $("#txtMessage").val();
        if (msg.length > 0)
        {
            var userName = $("#hdUserName").val();
            chatHub.server.sendMessageToAll(userName, msg);
            $("#txtMessage").val('');
        }
    });

    $("#txtNickName").keypress(function (e)
    {
        if (e.which == 13)
        {
            $("#btnStartChat").click();
        }
    });

    $("#txtMessage").keypress(function (e)
    {
        if (e.which == 13)
        {
            $("#btnSendMsg").click();
        }
    });
}

function registerClientMethods(chatHub)
{
    chatHub.client.onConnected = function (id, userName, allUsers, messages)
    {
        setScreen(true);

        $("#hdId").val(id);
        $("#hdUserName").val(userName);
        $("#spanUser").html(userName);

        //Add all users
        for (var i = 0; i < allUsers.length; i++)
        {
            AddUser(chatHub, allUsers[i].ConnectionId, allUsers[i].UserName);
        }

        //Add existing messages
        for (var i = 0; i < messages.length; i++)
        {
            AddMessage(messages[i].UserName, messages[i].Message);
        }
    }

    chatHub.client.onNewUserConnected = function (id, name)
    {
        AddUser(chatHub, id, name);
    }

    chatHub.client.onUserDisconnected = function (id, username)
    {
        $('#' + id).remove();

        var ctrId = "private_" + id;
        $('#' + ctrId).remove();

        var disc = $('<div class="disconnect">"' + username + '" logged off.</div>');

        $(disc).hide();
        $("#divUsers").prepend(disc);
        $(disc).fadeIn(200).delay(2000).fadeOut(200);
    }

    chatHub.client.messageReceived = function (userName, message)
    {
        AddMessage(userName, message);
    }

    chatHub.client.sendPrivateMessage = function (windowId, fromUserName, message)
    {
        var ctrId = "private_" + windowId;

        if ($('#' + ctrId).length == 0)
        {
            CreatePrivateChatWindow(chatHub, windowId, ctrId, fromUserName);
        }

        $('#' + ctrId).find("#divMessage").append('<div class="message"><span class="username">' + fromUserName + '</span>: ' + message + '</div>');

        //Set scroll bar
        var height = $('#' + ctrId).find("#divMessage")[0].scrollHeight;
        $('#' + ctrId).find("#divMessage").scrollTop(height);
    }

}

function AddUser(chatHub, id, name)
{
    var userId = $("#hdId").val();

    var code = "";

    if (userId == id)
    {
        code = $('<div class="loginUser">' + name + "</div>");
    } else
    {
        code = $('<a id="' + id + '" class="user" >' + name + '<a>');

        $(code).dblclick(function ()
        {
            var id = $(this).attr('id');

            if (userId != id)
            {
                OpenPrivateChatWindow(chatHub, id, name);
            }
        });
    }

    $("#divUsers").append(code);
}

function AddMessage(userName, message)
{
    $("#divChatWindow").append('<div class="message"><span class="userName">' + userName + '</span>: ' + message + '</div>');

    var height = $("#divChatWindow")[0].scrollHeight;
    $("#divChatWindow").scrollTop(height);
}

function OpenPrivateChatWindow(chatHub, id, userName)
{
    var ctrId = "private_" + id;

    if ($('#' + ctrId).length > 0)
    {
        return;
    }

    CreatePrivateChatWindow(chatHub, id, ctrId, userName);
}

function CreatePrivateChatWindow(chatHub, userId, ctrId, userName)
{
    var div = '<div id="' + ctrId + '" class="ui-widget-content draggable" rel="0">' +
                '<div class="header">' +
                    '<div style="float:right;">' +
                        '<img id="imgDelete" style="cursor:pointer;" src="/Images/delete.png"/>' +
                    '</div>' +

                    '<span class="selText" rel="0">' + userName + '</span>' +
                '</div>' +
                '<div id="divMessage" class="messageArea">' +

                '</div>' +
                '<div class="buttonBar">' +
                    '<input id="txtPrivateMessage" class="msgText" type="text" />' +
                    '<input id="btnSendMessage" class="submitButton button" type="button" value="Send" />' +
                '</div>' +
            '</div>';
    var $div = $(div);

    // Delete button
    $div.find("#imgDelete").click(function ()
    {
        $('#' + ctrId).remove();
    });

    // Send button event
    $div.find("#btnSendMessage").click(function ()
    {
        $textBox = $div.find("#txtPrivateMessage");
        var msg = $textBox.val();
        if (msg.length > 0)
        {
            chatHub.server.sendPrivateMessage(userId, msg);
            $textBox.val('');
        }
    });

    // Text box event
    $div.find("#txtPrivateMessage").keypress(function (e)
    {
        if (e.which == 13)
        {
            $div.find("#btnSendMessage").click();
        }
    });

    AddDivToContainer($div);
}

function AddDivToContainer($div)
{
    $("#divContainer").prepend($div);

    $div.draggable({
        handle: ".header",
        stop: function ()
        {

        }
    });
}