// Wrap Socket.IO client — connect voi JWT, expose helper join/emit/on.
// Yeu cau: trang phai load /socket.io/socket.io.js (server tu serve)
//          va api.js (de lay token).

(function (global) {
  let socket = null;

  function connect() {
    if (socket && socket.connected) return socket;
    if (!global.io) {
      console.warn('[socket.js] Socket.IO client chua load. Them <script src="/socket.io/socket.io.js"> truoc.');
      return null;
    }
    const token = api.getToken();
    if (!token) return null;

    socket = global.io({ auth: { token } });
    socket.on('connect_error', (err) => {
      console.warn('[socket.js] connect_error:', err.message);
    });
    return socket;
  }

  function joinConversation(id) {
    const s = connect();
    if (!s) return;
    s.emit('conversation:join', id);
  }
  function leaveConversation(id) {
    if (!socket) return;
    socket.emit('conversation:leave', id);
  }

  function on(event, handler) {
    const s = connect();
    if (!s) return;
    s.on(event, handler);
  }
  function off(event, handler) {
    if (!socket) return;
    socket.off(event, handler);
  }

  global.appSocket = { connect, joinConversation, leaveConversation, on, off };
})(window);
