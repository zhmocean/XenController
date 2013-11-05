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
  g.DBUtil.addLog("访问xenServer管理模块");

  $(function(){
    // show user name
    $("#actUserName").text(DB.actUser.name || "用户名");

    // bind the signout button, user click can signout.
    $("#btn-signout").click(function(){
      g.UserUtil.signout();
    });


    // bind the user tab 
    $("#tabs-xs").on('shown.bs.tab', function (e) {
      // e.target // activated tab
      // e.relatedTarget // previous tab
      
      // is the user list panel
      if (e.target.href.indexOf("panel-2") > 0){
        $("#list-log").empty().append(($.map(storage.get("logs"), function(l, index){
          return "<tr><td>" + (index - 0 + 1) + "</td><td>" + l.user.name + "</td><td>" 
                  + l.content + "</td><td>" + (new Date(l.time)).toLocaleString() +"</td></tr>";
        })).join(""));
        // g.DBUtil.addLog("浏览用户日志");
      }
    });

    

    $('#test').submit(function(e) {
      e.preventDefault();

      var username = $('#user').val()
        , password = $('#pass').val()
        , hostUrl = $('#hosturl').val()
        , demo = new XenAPI(username,password,hostUrl)
        , output = $('#output');

      g.DBUtil.addLog("连接xenServer Host: " + hostUrl + " | xenserver user: " + username);

      function resultHandler(result, test) {
        console.log(result);
        output.append('<h3>'+test+'</h3><div>'+result+'</div>');
      }

      demo.init(function(err,res) {
        if(err) {
          resultHandler(err, 'init');
        } else {
          demo.VM.get_all(function(err,res) {
            if(err) {
              resultHandler(err, 'VM.get_all');
            } else {
              resultHandler(res, 'VM.get_all');
            }

            resultHandler(demo.currentSession(), 'currentSession');

          });

          demo.serverVersion(function(err,res) {
            if(err) {
              resultHandler(err, 'serverVersion');
            } else {
              resultHandler(res, 'serverVersion');
            }
          });

          demo.getSession(function(err,res) {
            if(err) {
              resultHandler(err, 'getSession');
            } else {
              resultHandler(res, 'getSession');
            }

          });
        }
      });
    });

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

