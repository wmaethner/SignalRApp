using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace SignalRChatApp
{
	public class ChatHub : Hub
	{
		static List<UserDetails> ConnectedUsers = new List<UserDetails>();
		static List<MessageDetails> CurrentMessage = new List<MessageDetails>();

		public void Connect(string userName)
		{
			string id = Context.ConnectionId;

			if (ConnectedUsers.Count(x => x.ConnectedId == id) == 0)
			{
				ConnectedUsers.Add(new SignalRChatApp.UserDetails { ConnectedId = id, UserName = userName });

				Clients.Caller.onConnected(id, userName, ConnectedUsers, CurrentMessage);

				Clients.AllExcept(id).onNewUserConnected(id, userName);
			}
		}

		public void SendMessageToAll(string userName, string message)
		{
			AddMessageInCache(userName, message);
			Clients.All.messageReceived(userName, message);
		}

		public void SendPrivateMessage(string toUserId, string message)
		{
			string fromUserId = Context.ConnectionId;

			var toUser = ConnectedUsers.FirstOrDefault(x => x.ConnectedId == toUserId);
			var fromUser = ConnectedUsers.FirstOrDefault(x => x.ConnectedId == fromUserId);

			if (toUser!=null && fromUser != null) 
			{
				Clients.Client(toUserId).sendPrivateMessage(fromUserId, fromUser.UserName, message);
				Clients.Caller.sendPrivateMessage(toUserId, fromUser.UserName, message);
			}
		}

		public override Task OnDisconnected(bool stopCalled)
		{
			var item = ConnectedUsers.FirstOrDefault(x => x.ConnectedId == Context.ConnectionId);
			if (item != null)
			{
				ConnectedUsers.Remove(item);

				var id = Context.ConnectionId;
				Clients.All.onUserDisconnected(id, item.UserName);
			}

			return base.OnDisconnected(stopCalled);
		}

		private void AddMessageInCache(string userName, string message)
		{
			CurrentMessage.Add(new MessageDetails { UserName = userName, Message = message });
		}
	}
}