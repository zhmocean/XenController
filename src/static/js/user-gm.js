(function(g){
  var DBUtil = {
    getData: function(aName, p, v){
      var a = storage.get(aName);
      var index = $.inArray(v, $.map(a, function(o){return o[p];}));
      if (index < 0){
        return null;
      } else {
        return a[index];
      }
    },
    queryData: function(aName, p, v){
      var a = storage.get(aName);
      var vArray = $.isArray(v) ? v : [v];
      return $.map(vArray, function(ov, iv){
        return $.grep(a, function(oa, ia){
          return (ov === oa[p])
        });
      });
    },
    rmData: function(aName, p, v){
      var a = storage.get(aName);
      var vArray = $.isArray(v) ? v : [v];
      storage.set(aName, $.grep(a, function(o, i){var r = true; for (var k = 0; k < vArray.length; k ++){r = r && (vArray[k] !== o[p]);} return r;}));
      // refresh DB
      DB[aName] = storage.get(aName);
    },
    addLog: function(log){
      var logs = storage.get("logs") || [];
      logs.push({user: g.UserUtil.getActUser(), content: log, time: $.now()});
      storage.set("logs", logs);
      return logs;
    }
  };
  g.DBUtil = DBUtil;

  var userUtil = {
    isUserNameExisted: function(name){
      return $.inArray(name, $.map(g.DB.users, function(u){return u.name;})) > -1 ? true : false;
    }, 
    getUserByName: function(name){
      var index = $.inArray(name, $.map(g.DB.users, function(u){return u.name;}));
      if (index < 0){
        return false;
      } else {
        return g.DB.users[index];
      }
    },
    addUser: function(u){
      DB.users.push({
        id: u.id || $.now(),
        name: u.name,
        pwd: u.pwd,
        role: g.DBUtil.queryData("roles", "code", u.role),
        st: u.st === undefined ? 1 : 0
      });
      storage.set("users", DB.users);
      // console.log(storage.get("users"));
    },
    signin: function(u){
      storage.set("actUser", u);
      window.location.href = "./user-list.html";
    },
    signout: function(){
      g.DBUtil.addLog("用户退出系统");
      storage.empty();
      window.location.href = "./user-list.html";
    },
    getActUser: function(){
      var u = storage.get("actUser");
      if (u){
        return u;
      } else {
        window.location.href = "./index.html"
      }
    }
  };
  g.UserUtil = userUtil;


  var DB = {};
  g.DB = DB;
  DB.actUser = g.UserUtil.getActUser();

  DB.users = storage.get("users");
  DB.roles = storage.get("roles");
  g.DBUtil.addLog("访问用户授权管理模块");

  $(function(){
    // show user name
    $("#actUserName").text(DB.actUser.name || "用户名");

    // bind the signout button, user click can signout.
    $("#btn-signout").click(function(){
      g.UserUtil.signout();
    });


    swfobject.embedSWF("./EmbedableXenController.swf", "panel-gm", "100%", "620px", "9.0.0", "expressInstall.swf");



    // 权限管理
    var uRoleArray = $.map(DB.actUser.role, function(r, i){return r.code;});

    if ($.inArray("root", uRoleArray) > -1){
      $("#btn-addUser").show();
    }
    
    if ($.inArray("root", uRoleArray) > -1 || $.inArray("admin", uRoleArray) > -1){
      $("#UAMS").show();
    }

    if ($.inArray("root", uRoleArray) > -1 || $.inArray("admin", uRoleArray) > -1 || $.inArray("xenUser", uRoleArray) > -1){
      $("#XSMS").show();
    }

  });
})(window);

